#![no_std]
#![allow(clippy::too_many_arguments)]
use soroban_sdk::{
    contract, contractclient, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Active,
    Successful,
    Failed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FundingAsset {
    Xlm,
    Usdc,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
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
    pub funding_asset: FundingAsset,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlatformSettings {
    pub owner: Address,
    pub treasury_wallet: Address,
    pub staking_contract: Address,
    pub xlm_token: Address,
    pub usdc_token: Address,
    pub fee_basis_points: u32,
    pub staking_share_basis_points: u32,
    pub action_window_days: u32,
}

#[contracttype]
pub enum DataKey {
    Settings,
    CampaignCount,
    Campaign(u32),
    Donation(u32, Address),
    RefundClaimed(u32, Address),
}

#[contractclient(name = "AryaStakingClient")]
pub trait StakingContract {
    fn deposit_xlm_rewards(env: Env, from: Address, amount: i128);
    fn deposit_usdc_rewards(env: Env, from: Address, amount: i128);
}

#[contractevent(topics = ["arya", "campaign_created"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignCreatedEvent {
    #[topic]
    pub campaign_id: u32,
    #[topic]
    pub organizer: Address,
}

#[contractevent(topics = ["arya", "campaign_donated"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignDonatedEvent {
    #[topic]
    pub campaign_id: u32,
    #[topic]
    pub donor: Address,
    pub amount: i128,
}

#[contractevent(topics = ["arya", "campaign_withdrawn"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignWithdrawnEvent {
    #[topic]
    pub campaign_id: u32,
    pub organizer_share: i128,
    pub treasury_share: i128,
    pub staking_share: i128,
}

#[contractevent(topics = ["arya", "campaign_refunded"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignRefundedEvent {
    #[topic]
    pub campaign_id: u32,
    #[topic]
    pub donor: Address,
    pub amount: i128,
}

#[contract]
pub struct AryaCrowdfunding;

#[contractimpl]
impl AryaCrowdfunding {
    pub fn initialize(
        env: Env,
        owner: Address,
        treasury_wallet: Address,
        staking_contract: Address,
        xlm_token: Address,
        usdc_token: Address,
        fee_basis_points: u32,
        staking_share_basis_points: u32,
        action_window_days: u32,
    ) {
        if env.storage().instance().has(&DataKey::Settings) {
            panic!("already initialized");
        }
        if staking_share_basis_points > 10_000 || fee_basis_points > 10_000 {
            panic!("invalid basis points");
        }

        let settings = PlatformSettings {
            owner,
            treasury_wallet,
            staking_contract,
            xlm_token,
            usdc_token,
            fee_basis_points,
            staking_share_basis_points,
            action_window_days,
        };

        env.storage().instance().set(&DataKey::Settings, &settings);
        env.storage().instance().set(&DataKey::CampaignCount, &0u32);
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let settings = Self::get_platform_settings(env.clone());
        settings.owner.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn create_campaign(
        env: Env,
        organizer: Address,
        title: String,
        description: String,
        goal_amount: i128,
        deadline: u64,
        extension_days: u32,
        funding_asset: FundingAsset,
    ) -> u32 {
        organizer.require_auth();
        if goal_amount <= 0 {
            panic!("invalid goal");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("deadline in past");
        }

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);
        let campaign = Campaign {
            id: count,
            title,
            description,
            goal_amount,
            deadline,
            extension_days,
            extension_used: false,
            total_raised: 0,
            organizer: organizer.clone(),
            status: CampaignStatus::Active,
            funding_asset,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(count), &campaign);
        env.storage()
            .instance()
            .set(&DataKey::CampaignCount, &(count + 1));
        CampaignCreatedEvent {
            campaign_id: count,
            organizer,
        }
        .publish(&env);
        count
    }

    pub fn donate(env: Env, donor: Address, campaign_id: u32, amount: i128) {
        donor.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        if Self::is_campaign_failed_internal(&env, &campaign) {
            panic!("campaign failed");
        }
        if !matches!(campaign.status, CampaignStatus::Active) {
            panic!("campaign inactive");
        }
        if env.ledger().timestamp() > campaign.deadline {
            panic!("deadline passed");
        }
        if campaign.total_raised + amount > campaign.goal_amount {
            panic!("goal exceeded");
        }

        let token = Self::funding_token(&env, &campaign.funding_asset);
        token.transfer(&donor, env.current_contract_address(), &amount);

        let previous: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(
            &DataKey::Donation(campaign_id, donor.clone()),
            &(previous + amount),
        );

        campaign.total_raised += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        CampaignDonatedEvent {
            campaign_id,
            donor,
            amount,
        }
        .publish(&env);
    }

    pub fn withdraw(env: Env, campaign_id: u32) {
        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        campaign.organizer.require_auth();
        if campaign.total_raised < campaign.goal_amount {
            panic!("goal not met");
        }
        if !matches!(campaign.status, CampaignStatus::Active) {
            panic!("campaign inactive");
        }

        let settings = Self::get_platform_settings(env.clone());
        let fee = campaign.total_raised * settings.fee_basis_points as i128 / 10_000;
        let staking_share = fee * settings.staking_share_basis_points as i128 / 10_000;
        let treasury_share = fee - staking_share;
        let organizer_share = campaign.total_raised - fee;

        let token = Self::funding_token(&env, &campaign.funding_asset);
        if treasury_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &settings.treasury_wallet,
                &treasury_share,
            );
        }
        if organizer_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &campaign.organizer,
                &organizer_share,
            );
        }
        if staking_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &settings.staking_contract,
                &staking_share,
            );
            let staking = AryaStakingClient::new(&env, &settings.staking_contract);
            match campaign.funding_asset {
                FundingAsset::Xlm => {
                    staking.deposit_xlm_rewards(&env.current_contract_address(), &staking_share);
                }
                FundingAsset::Usdc => {
                    staking.deposit_usdc_rewards(&env.current_contract_address(), &staking_share);
                }
            }
        }

        campaign.status = CampaignStatus::Successful;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        CampaignWithdrawnEvent {
            campaign_id,
            organizer_share,
            treasury_share,
            staking_share,
        }
        .publish(&env);
    }

    pub fn extend_deadline(env: Env, campaign_id: u32) {
        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        campaign.organizer.require_auth();
        let settings = Self::get_platform_settings(env.clone());
        let now = env.ledger().timestamp();
        let action_window_secs = settings.action_window_days as u64 * 24 * 60 * 60;
        let action_window_expiry = campaign.deadline + action_window_secs;
        let threshold = campaign.goal_amount * 70 / 100;

        if campaign.extension_used {
            panic!("extension used");
        }
        if now <= campaign.deadline {
            panic!("deadline not passed");
        }
        if now > action_window_expiry {
            panic!("action window expired");
        }
        if campaign.total_raised < threshold {
            panic!("below threshold");
        }

        campaign.deadline += campaign.extension_days as u64 * 24 * 60 * 60;
        campaign.extension_used = true;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn mark_as_failed(env: Env, campaign_id: u32) {
        let mut campaign = Self::get_campaign(env.clone(), campaign_id);
        campaign.organizer.require_auth();
        campaign.status = CampaignStatus::Failed;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn claim_refund(env: Env, donor: Address, campaign_id: u32) {
        donor.require_auth();
        let campaign = Self::get_campaign(env.clone(), campaign_id);
        if !Self::is_campaign_failed_internal(&env, &campaign) {
            panic!("campaign not failed");
        }

        let claimed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::RefundClaimed(campaign_id, donor.clone()))
            .unwrap_or(false);
        if claimed {
            panic!("refund claimed");
        }

        let amount: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor.clone()))
            .unwrap_or(0);
        if amount <= 0 {
            panic!("no donation");
        }

        env.storage()
            .persistent()
            .set(&DataKey::RefundClaimed(campaign_id, donor.clone()), &true);
        let token = Self::funding_token(&env, &campaign.funding_asset);
        token.transfer(&env.current_contract_address(), &donor, &amount);
        CampaignRefundedEvent {
            campaign_id,
            donor,
            amount,
        }
        .publish(&env);
    }

    pub fn get_campaign(env: Env, campaign_id: u32) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found")
    }

    pub fn get_campaign_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    pub fn get_platform_settings(env: Env) -> PlatformSettings {
        env.storage()
            .instance()
            .get(&DataKey::Settings)
            .expect("not initialized")
    }

    pub fn get_donor_amount(env: Env, campaign_id: u32, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Donation(campaign_id, donor))
            .unwrap_or(0)
    }

    pub fn is_refund_claimed(env: Env, campaign_id: u32, donor: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::RefundClaimed(campaign_id, donor))
            .unwrap_or(false)
    }

    pub fn is_campaign_failed(env: Env, campaign_id: u32) -> bool {
        let campaign = Self::get_campaign(env.clone(), campaign_id);
        Self::is_campaign_failed_internal(&env, &campaign)
    }

    pub fn update_fee_settings(env: Env, fee_basis_points: u32, staking_share_basis_points: u32) {
        let mut settings = Self::get_platform_settings(env.clone());
        settings.owner.require_auth();
        settings.fee_basis_points = fee_basis_points;
        settings.staking_share_basis_points = staking_share_basis_points;
        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    pub fn update_treasury_wallet(env: Env, treasury_wallet: Address) {
        let mut settings = Self::get_platform_settings(env.clone());
        settings.owner.require_auth();
        settings.treasury_wallet = treasury_wallet;
        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    pub fn update_staking_contract(env: Env, staking_contract: Address) {
        let mut settings = Self::get_platform_settings(env.clone());
        settings.owner.require_auth();
        settings.staking_contract = staking_contract;
        env.storage().instance().set(&DataKey::Settings, &settings);
    }

    fn funding_token<'a>(
        env: &'a Env,
        funding_asset: &'a FundingAsset,
    ) -> soroban_sdk::token::Client<'a> {
        let settings = Self::get_platform_settings(env.clone());
        let token = match funding_asset {
            FundingAsset::Xlm => settings.xlm_token,
            FundingAsset::Usdc => settings.usdc_token,
        };
        soroban_sdk::token::Client::new(env, &token)
    }

    fn is_campaign_failed_internal(env: &Env, campaign: &Campaign) -> bool {
        match campaign.status {
            CampaignStatus::Failed => return true,
            CampaignStatus::Successful => return false,
            CampaignStatus::Active => {}
        }

        let settings = Self::get_platform_settings(env.clone());
        let now = env.ledger().timestamp();
        let threshold = campaign.goal_amount * 70 / 100;
        let action_window_expiry =
            campaign.deadline + settings.action_window_days as u64 * 24 * 60 * 60;

        if now > campaign.deadline && campaign.total_raised < threshold {
            return true;
        }
        if campaign.extension_used
            && now > campaign.deadline
            && campaign.total_raised < campaign.goal_amount
        {
            return true;
        }
        if now > action_window_expiry
            && !campaign.extension_used
            && campaign.total_raised >= threshold
        {
            return true;
        }
        false
    }
}

#[cfg(test)]
mod test;
