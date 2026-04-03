use super::*;
use soroban_sdk::{
    Address, Env,
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
};

struct Setup<'a> {
    env: Env,
    client: AryaStakingClient<'a>,
    staker: Address,
    arya_client: TokenClient<'a>,
    xlm_client: TokenClient<'a>,
    usdc_client: TokenClient<'a>,
    xlm_admin: StellarAssetClient<'a>,
    usdc_admin: StellarAssetClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let staker = Address::generate(&env);
    let distributor = Address::generate(&env);

    let arya_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();
    let xlm_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();
    let usdc_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();

    let arya_client = TokenClient::new(&env, &arya_token);
    let xlm_client = TokenClient::new(&env, &xlm_token);
    let usdc_client = TokenClient::new(&env, &usdc_token);
    let arya_admin = StellarAssetClient::new(&env, &arya_token);
    let xlm_admin = StellarAssetClient::new(&env, &xlm_token);
    let usdc_admin = StellarAssetClient::new(&env, &usdc_token);

    arya_admin.mint(&staker, &10_000_000_000_i128);
    xlm_admin.mint(&distributor, &10_000_000_000_i128);
    usdc_admin.mint(&distributor, &10_000_000_000_i128);

    let contract_id = env.register(AryaStaking, ());
    let client = AryaStakingClient::new(&env, &contract_id);
    client.initialize(&owner, &arya_token, &xlm_token, &usdc_token, &7u32);

    Setup {
        env,
        client,
        staker,
        arya_client,
        xlm_client,
        usdc_client,
        xlm_admin,
        usdc_admin,
    }
}

#[test]
fn stake_and_claim_both_reward_pools() {
    let s = setup();
    let distributor = Address::generate(&s.env);
    s.xlm_admin.mint(&distributor, &500_0000000i128);
    s.usdc_admin.mint(&distributor, &200_0000000i128);

    s.client.stake(&s.staker, &100_0000000i128, &7u32);
    s.xlm_client
        .transfer(&distributor, &s.client.address, &50_0000000i128);
    s.usdc_client
        .transfer(&distributor, &s.client.address, &20_0000000i128);
    s.client.deposit_xlm_rewards(&distributor, &50_0000000i128);
    s.client.deposit_usdc_rewards(&distributor, &20_0000000i128);

    let xlm_before = s.xlm_client.balance(&s.staker);
    let usdc_before = s.usdc_client.balance(&s.staker);
    let claimed = s.client.claim_rewards(&s.staker);
    let xlm_after = s.xlm_client.balance(&s.staker);
    let usdc_after = s.usdc_client.balance(&s.staker);

    assert_eq!(claimed, (50_0000000i128, 20_0000000i128));
    assert_eq!(xlm_after - xlm_before, 50_0000000i128);
    assert_eq!(usdc_after - usdc_before, 20_0000000i128);
}

#[test]
fn queued_rewards_are_distributed_after_first_stake() {
    let s = setup();
    let distributor = Address::generate(&s.env);
    s.xlm_admin.mint(&distributor, &500_0000000i128);

    s.xlm_client
        .transfer(&distributor, &s.client.address, &30_0000000i128);
    s.client.deposit_xlm_rewards(&distributor, &30_0000000i128);
    s.client.stake(&s.staker, &100_0000000i128, &7u32);

    let claimed = s.client.claim_rewards(&s.staker);
    assert_eq!(claimed, (30_0000000i128, 0));
}

#[test]
fn unstake_requires_lock_expiry() {
    let s = setup();
    s.client.stake(&s.staker, &100_0000000i128, &7u32);
    s.env.ledger().set_timestamp(8 * 24 * 60 * 60);
    s.client.unstake(&s.staker, &100_0000000i128);
    assert_eq!(s.arya_client.balance(&s.staker), 10_000_000_000_i128);
}

#[test]
fn owner_can_transfer_ownership() {
    let s = setup();
    let new_owner = Address::generate(&s.env);

    s.client.transfer_ownership(&new_owner);

    let settings = s.client.get_settings();
    assert_eq!(settings.owner, new_owner);
}

#[test]
fn owner_can_update_staking_settings() {
    let s = setup();
    let new_stake_token = Address::generate(&s.env);

    s.client.update_stake_token(&new_stake_token);
    s.client.update_min_lockup_days(&14u32);

    let settings = s.client.get_settings();
    assert_eq!(settings.stake_token, new_stake_token);
    assert_eq!(settings.min_lockup_days, 14u32);
}
