#![cfg(test)]

use arya_staking::{AryaStaking, AryaStakingClient, RewardAsset};
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

struct Setup<'a> {
    env: Env,
    client: AryaCrowdfundingClient<'a>,
    staking_client: AryaStakingClient<'a>,
    owner: Address,
    organizer: Address,
    donor: Address,
    treasury: Address,
    xlm_token: Address,
    usdc_token: Address,
    xlm_client: TokenClient<'a>,
    usdc_client: TokenClient<'a>,
    xlm_admin: StellarAssetClient<'a>,
    usdc_admin: StellarAssetClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let organizer = Address::generate(&env);
    let donor = Address::generate(&env);
    let treasury = Address::generate(&env);

    let arya_token = env.register_stellar_asset_contract_v2(owner.clone()).address();
    let xlm_token = env.register_stellar_asset_contract_v2(owner.clone()).address();
    let usdc_token = env.register_stellar_asset_contract_v2(owner.clone()).address();

    let xlm_client = TokenClient::new(&env, &xlm_token);
    let usdc_client = TokenClient::new(&env, &usdc_token);
    let xlm_admin = StellarAssetClient::new(&env, &xlm_token);
    let usdc_admin = StellarAssetClient::new(&env, &usdc_token);
    xlm_admin.mint(&donor, &1_000_0000000i128);
    usdc_admin.mint(&donor, &1_000_0000000i128);

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
        owner,
        organizer,
        donor,
        treasury,
        xlm_token,
        usdc_token,
        xlm_client,
        usdc_client,
        xlm_admin,
        usdc_admin,
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
    let after = s.usdc_client.balance(&s.donor);
    assert_eq!(after - before, 20_0000000i128);
}
