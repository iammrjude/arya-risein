use super::*;
use arya_staking::{AryaStaking, AryaStakingClient, RewardAsset};
use soroban_sdk::{
    Address, Env,
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
};

struct Setup<'a> {
    env: Env,
    client: AryaLaunchpadClient<'a>,
    staking_client: AryaStakingClient<'a>,
    project_owner: Address,
    buyer: Address,
    treasury: Address,
    sale_token: Address,
    xlm_client: TokenClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let project_owner = Address::generate(&env);
    let buyer = Address::generate(&env);
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
    let sale_token = env
        .register_stellar_asset_contract_v2(owner.clone())
        .address();

    let xlm_client = TokenClient::new(&env, &xlm_token);
    let xlm_admin = StellarAssetClient::new(&env, &xlm_token);
    let sale_admin = StellarAssetClient::new(&env, &sale_token);
    xlm_admin.mint(&buyer, &10_000_000_000_i128);
    sale_admin.mint(&project_owner, &10_000_000_000_i128);

    let staking_id = env.register(AryaStaking, ());
    let staking_client = AryaStakingClient::new(&env, &staking_id);
    staking_client.initialize(&owner, &arya_token, &xlm_token, &usdc_token, &7u32);

    let contract_id = env.register(AryaLaunchpad, ());
    let client = AryaLaunchpadClient::new(&env, &contract_id);
    client.initialize(
        &owner,
        &treasury,
        &staking_id,
        &xlm_token,
        &usdc_token,
        &300u32,
        &5000u32,
    );

    Setup {
        env,
        client,
        staking_client,
        project_owner,
        buyer,
        treasury,
        sale_token,
        xlm_client,
    }
}

#[test]
fn successful_sale_shares_fee_with_staking() {
    let s = setup();
    let start = s.env.ledger().timestamp() + 1;
    let end = start + 10;
    let sale_id = s.client.create_sale(
        &s.project_owner,
        &s.sale_token,
        &10_0000000i128,
        &100i128,
        &100_0000000i128,
        &100_0000000i128,
        &start,
        &end,
        &FundingAsset::Xlm,
    );

    s.env.ledger().set_timestamp(start + 1);
    s.client.contribute(&s.buyer, &sale_id, &100_0000000i128);
    s.env.ledger().set_timestamp(end + 1);

    let treasury_before = s.xlm_client.balance(&s.treasury);
    s.client.withdraw_funds(&sale_id);
    let treasury_after = s.xlm_client.balance(&s.treasury);
    assert_eq!(treasury_after - treasury_before, 15_000000i128);

    let pool = s.staking_client.get_pool(&RewardAsset::Xlm);
    assert_eq!(pool.queued_rewards, 15_000000i128);
    let claimed = s.client.claim_tokens(&s.buyer, &sale_id);
    assert_eq!(claimed, 10i128);
}

#[test]
fn sale_getters_contribution_and_refund_paths_work() {
    let s = setup();
    let start = s.env.ledger().timestamp() + 1;
    let end = start + 10;
    let sale_id = s.client.create_sale(
        &s.project_owner,
        &s.sale_token,
        &10_0000000i128,
        &100i128,
        &150_0000000i128,
        &200_0000000i128,
        &start,
        &end,
        &FundingAsset::Xlm,
    );

    assert_eq!(s.client.get_sale_count(), 1u32);
    let created = s.client.get_sale(&sale_id);
    assert_eq!(created.status, SaleStatus::Active);

    s.env.ledger().set_timestamp(start + 1);
    s.client.contribute(&s.buyer, &sale_id, &100_0000000i128);
    assert_eq!(
        s.client.get_contribution(&sale_id, &s.buyer),
        100_0000000i128
    );

    s.env.ledger().set_timestamp(end + 1);
    let before = s.xlm_client.balance(&s.buyer);
    s.client.claim_refund(&s.buyer, &sale_id);
    let after = s.xlm_client.balance(&s.buyer);
    assert_eq!(after - before, 100_0000000i128);

    s.client.reclaim_unsold_tokens(&sale_id);
    let failed_sale = s.client.get_sale(&sale_id);
    assert_eq!(failed_sale.status, SaleStatus::Failed);
    assert!(failed_sale.unsold_reclaimed);
}

#[test]
fn owner_can_transfer_ownership() {
    let s = setup();
    let new_owner = Address::generate(&s.env);

    s.client.transfer_ownership(&new_owner);

    let settings = s.client.get_platform_settings();
    assert_eq!(settings.owner, new_owner);
}

#[test]
fn owner_can_update_launchpad_settings() {
    let s = setup();
    let new_treasury = Address::generate(&s.env);
    let new_staking = Address::generate(&s.env);

    s.client.update_treasury_wallet(&new_treasury);
    s.client.update_staking_contract(&new_staking);
    s.client.update_fee_settings(&450u32, &6000u32);

    let settings = s.client.get_platform_settings();
    assert_eq!(settings.treasury_wallet, new_treasury);
    assert_eq!(settings.staking_contract, new_staking);
    assert_eq!(settings.fee_basis_points, 450u32);
    assert_eq!(settings.staking_share_basis_points, 6000u32);
}
