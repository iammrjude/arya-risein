use super::*;
use arya_staking::{AryaStaking, AryaStakingClient, RewardAsset};
use soroban_sdk::{
    Address, Env, String,
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
};

struct Setup<'a> {
    env: Env,
    client: AryaCrowdfundingClient<'a>,
    staking_client: AryaStakingClient<'a>,
    organizer: Address,
    donor: Address,
    treasury: Address,
    xlm_client: TokenClient<'a>,
    usdc_client: TokenClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let organizer = Address::generate(&env);
    let donor = Address::generate(&env);
    let treasury = Address::generate(&env);

    let arya_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();
    let xlm_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();
    let usdc_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();

    let xlm_client = TokenClient::new(&env, &xlm_token);
    let usdc_client = TokenClient::new(&env, &usdc_token);
    let xlm_admin = StellarAssetClient::new(&env, &xlm_token);
    let usdc_admin = StellarAssetClient::new(&env, &usdc_token);
    xlm_admin.mint(&donor, &10_000_000_000_i128);
    usdc_admin.mint(&donor, &10_000_000_000_i128);

    let staking_id = env.register(AryaStaking, ());
    let staking_client = AryaStakingClient::new(&env, &staking_id);
    staking_client.initialize(&owner, &arya_token, &xlm_token, &usdc_token, &7u32);

    let contract_id = env.register(AryaCrowdfunding, ());
    let client = AryaCrowdfundingClient::new(&env, &contract_id);
    client.initialize(
        &owner,
        &treasury,
        &staking_id,
        &xlm_token,
        &usdc_token,
        &250u32,
        &5000u32,
        &7u32,
    );

    Setup {
        env,
        client,
        staking_client,
        organizer,
        donor,
        treasury,
        xlm_client,
        usdc_client,
    }
}

#[test]
fn successful_xlm_withdraw_sends_reward_share_to_staking() {
    let s = setup();
    let deadline = s.env.ledger().timestamp() + 30 * 24 * 60 * 60;
    let campaign_id = s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Arya"),
        &String::from_str(&s.env, "Build Arya"),
        &100_0000000i128,
        &deadline,
        &7u32,
        &FundingAsset::Xlm,
    );

    s.client.donate(&s.donor, &campaign_id, &100_0000000i128);
    let treasury_before = s.xlm_client.balance(&s.treasury);
    s.client.withdraw(&campaign_id);
    let treasury_after = s.xlm_client.balance(&s.treasury);

    assert_eq!(treasury_after - treasury_before, 12_500000i128);
    let xlm_pool = s.staking_client.get_pool(&RewardAsset::Xlm);
    assert_eq!(xlm_pool.queued_rewards, 12_500000i128);
}

#[test]
fn campaign_lifecycle_getters_and_extension_work() {
    let s = setup();
    let deadline = s.env.ledger().timestamp() + 10;
    let campaign_id = s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Extend Me"),
        &String::from_str(&s.env, "Needs more time"),
        &100_0000000i128,
        &deadline,
        &7u32,
        &FundingAsset::Xlm,
    );

    assert_eq!(s.client.get_campaign_count(), 1u32);
    let created = s.client.get_campaign(&campaign_id);
    assert_eq!(created.title, String::from_str(&s.env, "Extend Me"));
    assert_eq!(created.status, CampaignStatus::Active);

    s.client.donate(&s.donor, &campaign_id, &80_0000000i128);
    assert_eq!(
        s.client.get_donor_amount(&campaign_id, &s.donor),
        80_0000000i128
    );

    s.env.ledger().set_timestamp(deadline + 1);
    s.client.extend_deadline(&campaign_id);

    let updated = s.client.get_campaign(&campaign_id);
    assert!(updated.extension_used);
    assert_eq!(updated.deadline, deadline + (7 * 24 * 60 * 60));
}

#[test]
fn usdc_campaign_refund_works_after_failure() {
    let s = setup();
    let deadline = s.env.ledger().timestamp() + 30 * 24 * 60 * 60;
    let campaign_id = s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "USDC Raise"),
        &String::from_str(&s.env, "Stable campaign"),
        &100_0000000i128,
        &deadline,
        &7u32,
        &FundingAsset::Usdc,
    );

    s.client.donate(&s.donor, &campaign_id, &20_0000000i128);
    let before = s.usdc_client.balance(&s.donor);
    s.env.ledger().set_timestamp(40 * 24 * 60 * 60);
    assert!(s.client.is_campaign_failed(&campaign_id));
    s.client.claim_refund(&s.donor, &campaign_id);
    assert!(s.client.is_refund_claimed(&campaign_id, &s.donor));
    let after = s.usdc_client.balance(&s.donor);
    assert_eq!(after - before, 20_0000000i128);
}

#[test]
fn organizer_can_mark_campaign_as_failed() {
    let s = setup();
    let deadline = s.env.ledger().timestamp() + 30 * 24 * 60 * 60;
    let campaign_id = s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Manual Fail"),
        &String::from_str(&s.env, "Organizer action"),
        &100_0000000i128,
        &deadline,
        &7u32,
        &FundingAsset::Xlm,
    );

    s.client.mark_as_failed(&campaign_id);

    let campaign = s.client.get_campaign(&campaign_id);
    assert_eq!(campaign.status, CampaignStatus::Failed);
    assert!(s.client.is_campaign_failed(&campaign_id));
}

#[test]
fn owner_can_update_action_window_days() {
    let s = setup();

    s.client.update_action_window_days(&14u32);

    let settings = s.client.get_platform_settings();
    assert_eq!(settings.action_window_days, 14u32);
}

#[test]
fn owner_can_update_crowdfunding_settings() {
    let s = setup();
    let new_treasury = Address::generate(&s.env);
    let new_staking = Address::generate(&s.env);

    s.client.update_fee_settings(&300u32, &5500u32);
    s.client.update_treasury_wallet(&new_treasury);
    s.client.update_staking_contract(&new_staking);

    let settings = s.client.get_platform_settings();
    assert_eq!(settings.fee_basis_points, 300u32);
    assert_eq!(settings.staking_share_basis_points, 5500u32);
    assert_eq!(settings.treasury_wallet, new_treasury);
    assert_eq!(settings.staking_contract, new_staking);
}

#[test]
fn owner_can_transfer_ownership() {
    let s = setup();
    let new_owner = Address::generate(&s.env);

    s.client.transfer_ownership(&new_owner);

    let settings = s.client.get_platform_settings();
    assert_eq!(settings.owner, new_owner);
}
