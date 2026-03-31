#![no_std]
use soroban_sdk::{
    Address, Env, String, contract, contractimpl, contracttype, /* symbol_short, */
};

// ===== DATA TYPES =====

#[contracttype]
#[derive(Clone)]
pub enum CampaignStatus {
    Active,
    Successful,
    Failed,
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub goal_amount: i128,
    pub deadline: u64,
    pub extension_days: u32,
    pub extension_used: bool,
    pub total_raised: i128,
    pub organizer: Address,
    pub status: CampaignStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct PlatformSettings {
    pub platform_owner: Address,
    pub treasury_wallet: Address,
    pub fee_basis_points: u32,
    pub action_window_days: u32,
    pub native_token: Address,
}

// ===== STORAGE KEYS =====

#[contracttype]
pub enum DataKey {
    Settings,
    CampaignCount,
    Campaign(u32),
    Donation(u32, Address),
    RefundClaimed(u32, Address),
}

// ===== CONTRACT =====

#[contract]
pub struct AryaFund;

#[contractimpl]
impl AryaFund {
    // ===== INITIALIZE =====

    pub fn initialize(
        env: Env,
        platform_owner: Address,
        treasury_wallet: Address,
        fee_basis_points: u32,
        action_window_days: u32,
        native_token: Address,
    ) {
        // Can only be called once
        if env.storage().instance().has(&DataKey::Settings) {
            panic!("Already initialized");
        }

        let settings = PlatformSettings {
            platform_owner,
            treasury_wallet,
            fee_basis_points,
            action_window_days,
            native_token,
        };

        env.storage().instance().set(&DataKey::Settings, &settings);
        env.storage().instance().set(&DataKey::CampaignCount, &0u32);
    }

    // ===== CAMPAIGN FUNCTIONS =====

    pub fn create_campaign(
        env: Env,
        organizer: Address,
        title: String,
        description: String,
        goal_amount: i128,
        deadline: u64,
        extension_days: u32,
    ) -> u32 {
        organizer.require_auth();

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);
        let campaign_id = count;

        let campaign = Campaign {
            id: campaign_id,
            title,
            description,
            goal_amount,
            deadline,
            extension_days,
            extension_used: false,
            total_raised: 0,
            organizer,
            status: CampaignStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        env.storage()
            .instance()
            .set(&DataKey::CampaignCount, &(count + 1));

        campaign_id
    }

    pub fn donate(env: Env, donor: Address, campaign_id: u32, amount: i128) {
        donor.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        // Must be active
        if Self::is_campaign_failed_internal(&env, &campaign) {
            panic!("Campaign has failed");
        }

        match campaign.status {
            CampaignStatus::Active => {}
            _ => panic!("Campaign is not active"),
        }

        // Check deadline
        let now = env.ledger().timestamp();
        if now > campaign.deadline {
            panic!("Campaign deadline has passed");
        }

        // Check donation does not exceed goal
        let new_total = campaign.total_raised + amount;
        if new_total > campaign.goal_amount {
            panic!("Donation would exceed campaign goal");
        }

        // Transfer XLM from donor to contract using native SAC
        let native_token = get_native_token(&env);
        native_token.transfer(&donor, env.current_contract_address(), &amount);

        // Record donation
        let prev: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Donation(campaign_id, donor), &(prev + amount));

        campaign.total_raised += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn withdraw(env: Env, campaign_id: u32) {
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        campaign.organizer.require_auth();

        // Goal must be met
        if campaign.total_raised < campaign.goal_amount {
            panic!("Goal not yet met");
        }

        match campaign.status {
            CampaignStatus::Active => {}
            _ => panic!("Campaign is not active"),
        }

        let settings: PlatformSettings = env.storage().instance().get(&DataKey::Settings).unwrap();

        // Calculate fee
        let fee = (campaign.total_raised * settings.fee_basis_points as i128) / 10000;
        let organizer_amount = campaign.total_raised - fee;

        let native_token = get_native_token(&env);

        // Send fee to treasury
        if fee > 0 {
            native_token.transfer(
                &env.current_contract_address(),
                &settings.treasury_wallet,
                &fee,
            );
        }

        // Send remainder to organizer
        native_token.transfer(
            &env.current_contract_address(),
            &campaign.organizer,
            &organizer_amount,
        );

        campaign.status = CampaignStatus::Successful;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn extend_deadline(env: Env, campaign_id: u32) {
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        campaign.organizer.require_auth();

        let settings: PlatformSettings = env.storage().instance().get(&DataKey::Settings).unwrap();

        let now = env.ledger().timestamp();
        let action_window_secs = settings.action_window_days as u64 * 24 * 60 * 60;
        let action_window_expiry = campaign.deadline + action_window_secs;

        // Checks
        if campaign.extension_used {
            panic!("Extension already used");
        }
        if now <= campaign.deadline {
            panic!("Deadline has not passed yet");
        }
        if now > action_window_expiry {
            panic!("Action window has expired");
        }
        // Must be 70%+ raised
        let threshold = (campaign.goal_amount * 70) / 100;
        if campaign.total_raised < threshold {
            panic!("Less than 70% raised, cannot extend");
        }

        let extension_secs = campaign.extension_days as u64 * 24 * 60 * 60;
        campaign.deadline += extension_secs;
        campaign.extension_used = true;

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn mark_as_failed(env: Env, campaign_id: u32) {
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        campaign.organizer.require_auth();

        match campaign.status {
            CampaignStatus::Active => {}
            _ => panic!("Campaign is not active"),
        }

        campaign.status = CampaignStatus::Failed;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn claim_refund(env: Env, donor: Address, campaign_id: u32) {
        donor.require_auth();

        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        // Must be failed
        if !Self::is_campaign_failed_internal(&env, &campaign) {
            panic!("Campaign has not failed");
        }

        // Check not already refunded
        let already_claimed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::RefundClaimed(campaign_id, donor.clone()))
            .unwrap_or(false);

        if already_claimed {
            panic!("Refund already claimed");
        }

        // Get donation amount
        let amount: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor.clone()))
            .unwrap_or(0);

        if amount <= 0 {
            panic!("No donation found for this address");
        }

        // Mark as refunded
        env.storage()
            .persistent()
            .set(&DataKey::RefundClaimed(campaign_id, donor.clone()), &true);

        // Transfer back to donor
        let native_token = get_native_token(&env);
        native_token.transfer(&env.current_contract_address(), &donor, &amount);
    }

    // ===== READ FUNCTIONS =====

    pub fn is_campaign_failed(env: Env, campaign_id: u32) -> bool {
        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        Self::is_campaign_failed_internal(&env, &campaign)
    }

    pub fn get_campaign(env: Env, campaign_id: u32) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found")
    }

    pub fn get_campaign_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    pub fn get_donor_amount(env: Env, campaign_id: u32, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor))
            .unwrap_or(0)
    }

    pub fn get_platform_settings(env: Env) -> PlatformSettings {
        env.storage()
            .instance()
            .get(&DataKey::Settings)
            .expect("Not initialized")
    }

    pub fn is_refund_claimed(env: Env, campaign_id: u32, donor: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::RefundClaimed(campaign_id, donor))
            .unwrap_or(false)
    }

    // ===== ADMIN FUNCTIONS =====

    pub fn update_fee_percent(env: Env, new_fee: u32) {
        let mut settings: PlatformSettings =
            env.storage().instance().get(&DataKey::Settings).unwrap();

        settings.platform_owner.require_auth();
        settings.fee_basis_points = new_fee;

        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    pub fn update_treasury_wallet(env: Env, new_wallet: Address) {
        let mut settings: PlatformSettings =
            env.storage().instance().get(&DataKey::Settings).unwrap();

        settings.platform_owner.require_auth();
        settings.treasury_wallet = new_wallet;

        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    pub fn update_action_window(env: Env, new_days: u32) {
        let mut settings: PlatformSettings =
            env.storage().instance().get(&DataKey::Settings).unwrap();

        settings.platform_owner.require_auth();
        settings.action_window_days = new_days;

        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let mut settings: PlatformSettings =
            env.storage().instance().get(&DataKey::Settings).unwrap();

        settings.platform_owner.require_auth();
        settings.platform_owner = new_owner;

        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    // ===== INTERNAL HELPERS =====

    fn is_campaign_failed_internal(env: &Env, campaign: &Campaign) -> bool {
        // Already explicitly marked as failed
        match campaign.status {
            CampaignStatus::Failed => return true,
            CampaignStatus::Successful => return false,
            CampaignStatus::Active => {}
        }

        let settings: PlatformSettings = env.storage().instance().get(&DataKey::Settings).unwrap();

        let now = env.ledger().timestamp();
        let action_window_secs = settings.action_window_days as u64 * 24 * 60 * 60;
        let threshold = (campaign.goal_amount * 70) / 100;

        // Deadline passed and less than 70% raised
        if now > campaign.deadline && campaign.total_raised < threshold {
            return true;
        }

        // Extended deadline passed and goal not met
        if campaign.extension_used
            && now > campaign.deadline
            && campaign.total_raised < campaign.goal_amount
        {
            return true;
        }

        // Action window expired with no action taken (70%+ raised but organizer did nothing)
        let action_window_expiry = campaign.deadline + action_window_secs;
        if now > action_window_expiry
            && !campaign.extension_used
            && campaign.total_raised >= threshold
        {
            return true;
        }

        false
    }
}

// ===== NATIVE TOKEN HELPER =====

fn get_native_token(env: &Env) -> soroban_sdk::token::Client<'_> {
    let settings: PlatformSettings = env.storage().instance().get(&DataKey::Settings).unwrap();

    soroban_sdk::token::Client::new(env, &settings.native_token)
}

#[cfg(test)]
mod test;
