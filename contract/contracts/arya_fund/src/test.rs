use super::*;
use soroban_sdk::{
    Address, Env, String,
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
};

// ===== HELPERS =====

fn create_env() -> Env {
    Env::default()
}

fn days(n: u64) -> u64 {
    n * 24 * 60 * 60
}

fn advance_time(env: &Env, seconds: u64) {
    env.ledger()
        .set_timestamp(env.ledger().timestamp() + seconds);
}

fn now(env: &Env) -> u64 {
    env.ledger().timestamp()
}

struct TestSetup<'a> {
    env: Env,
    client: AryaFundClient<'a>,
    platform_owner: Address,
    treasury: Address,
    organizer: Address,
    donor: Address,
    native_token: Address,
    token_client: TokenClient<'a>,
    #[allow(dead_code)]
    token_admin: StellarAssetClient<'a>,
}

fn setup<'a>() -> TestSetup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    // Register contract
    let contract_id = env.register(AryaFund, ());
    let client = AryaFundClient::new(&env, &contract_id);

    // Generate addresses
    let platform_owner = Address::generate(&env);
    let treasury = Address::generate(&env);
    let organizer = Address::generate(&env);
    let donor = Address::generate(&env);

    // Register native token SAC
    let native_token_id = env.register_stellar_asset_contract_v2(platform_owner.clone());
    let native_token = native_token_id.address();
    let token_client = TokenClient::new(&env, &native_token);
    let token_admin = StellarAssetClient::new(&env, &native_token);

    // Mint tokens to organizer and donor for testing
    token_admin.mint(&organizer, &10_000_000_000_000_i128); // 1M XLM
    token_admin.mint(&donor, &10_000_000_000_000_i128); // 1M XLM

    // Initialize contract
    client.initialize(
        &platform_owner,
        &treasury,
        &250u32, // 2.5% fee
        &7u32,   // 7 day action window
        &native_token,
    );

    TestSetup {
        env,
        client,
        platform_owner,
        treasury,
        organizer,
        donor,
        native_token,
        token_client,
        token_admin,
    }
}

fn create_campaign_helper(s: &TestSetup, goal: i128, deadline_days: u64) -> u32 {
    let deadline = now(&s.env) + days(deadline_days);
    s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Test Campaign"),
        &String::from_str(&s.env, "Test Description"),
        &goal,
        &deadline,
        &30u32,
    )
}

// ===== INITIALIZE TESTS =====

#[test]
fn test_initialize() {
    let env = create_env();
    env.mock_all_auths();
    let contract_id = env.register(AryaFund, ());
    let client = AryaFundClient::new(&env, &contract_id);
    let platform_owner = Address::generate(&env);
    let treasury = Address::generate(&env);
    let native_token = Address::generate(&env);

    client.initialize(&platform_owner, &treasury, &250u32, &7u32, &native_token);

    let settings = client.get_platform_settings();
    assert_eq!(settings.platform_owner, platform_owner);
    assert_eq!(settings.treasury_wallet, treasury);
    assert_eq!(settings.fee_basis_points, 250);
    assert_eq!(settings.action_window_days, 7);
    assert_eq!(settings.native_token, native_token);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_initialize_twice_fails() {
    let env = create_env();
    env.mock_all_auths();
    let contract_id = env.register(AryaFund, ());
    let client = AryaFundClient::new(&env, &contract_id);
    let platform_owner = Address::generate(&env);
    let treasury = Address::generate(&env);
    let native_token = Address::generate(&env);

    client.initialize(&platform_owner, &treasury, &250u32, &7u32, &native_token);
    client.initialize(&platform_owner, &treasury, &250u32, &7u32, &native_token);
}

// ===== GET PLATFORM SETTINGS TEST =====

#[test]
fn test_get_platform_settings() {
    let s = setup();
    let settings = s.client.get_platform_settings();
    assert_eq!(settings.platform_owner, s.platform_owner);
    assert_eq!(settings.treasury_wallet, s.treasury);
    assert_eq!(settings.fee_basis_points, 250);
    assert_eq!(settings.action_window_days, 7);
    assert_eq!(settings.native_token, s.native_token);
}

// ===== CREATE CAMPAIGN TESTS =====

#[test]
fn test_create_campaign() {
    let s = setup();
    let deadline = now(&s.env) + days(30);
    let campaign_id = s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Solar Panels"),
        &String::from_str(&s.env, "Community solar project"),
        &100_000_000_000_i128,
        &deadline,
        &45u32,
    );

    assert_eq!(campaign_id, 0);
    let campaign = s.client.get_campaign(&campaign_id);
    assert_eq!(campaign.id, 0);
    assert_eq!(campaign.goal_amount, 100_000_000_000_i128);
    assert_eq!(campaign.total_raised, 0);
    assert!(!campaign.extension_used);
    assert_eq!(campaign.extension_days, 45);
    assert_eq!(campaign.organizer, s.organizer);
}

#[test]
fn test_campaign_count_increments() {
    let s = setup();
    let deadline = now(&s.env) + days(30);

    s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Campaign 1"),
        &String::from_str(&s.env, "Description 1"),
        &10_000_000_000_i128,
        &deadline,
        &30u32,
    );
    s.client.create_campaign(
        &s.organizer,
        &String::from_str(&s.env, "Campaign 2"),
        &String::from_str(&s.env, "Description 2"),
        &20_000_000_000_i128,
        &deadline,
        &30u32,
    );

    assert_eq!(s.client.get_campaign_count(), 2);
}

// ===== DONATE TESTS =====

#[test]
fn test_donate_successful() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    let donate_amount = 100_0000000i128; // 100 XLM
    s.client.donate(&s.donor, &campaign_id, &donate_amount);

    let campaign = s.client.get_campaign(&campaign_id);
    assert_eq!(campaign.total_raised, donate_amount);

    let donor_amount = s.client.get_donor_amount(&campaign_id, &s.donor);
    assert_eq!(donor_amount, donate_amount);
}

#[test]
fn test_donate_exact_goal_amount_accepted() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Donate exactly the goal amount — should succeed
    s.client.donate(&s.donor, &campaign_id, &goal);

    let campaign = s.client.get_campaign(&campaign_id);
    assert_eq!(campaign.total_raised, goal);
}

#[test]
#[should_panic(expected = "Donation would exceed campaign goal")]
fn test_donate_exceeds_goal_cap_rejected() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Donate 80% first
    let first_donation = 800_0000000i128; // 800 XLM
    s.client.donate(&s.donor, &campaign_id, &first_donation);

    // Try to donate 300 XLM — 800 + 300 = 1100 > 1000, should panic
    let second_donation = 300_0000000i128;
    s.client.donate(&s.donor, &campaign_id, &second_donation);
}

#[test]
#[should_panic(expected = "Donation would exceed campaign goal")]
fn test_donate_rejected_when_goal_already_reached() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Fill up the goal completely
    s.client.donate(&s.donor, &campaign_id, &goal);

    // Try to donate any amount — goal already 100%, should panic
    s.client.donate(&s.donor, &campaign_id, &1_0000000i128); // 1 XLM
}

#[test]
#[should_panic(expected = "Campaign has failed")]
fn test_donate_rejected_after_deadline() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Advance past deadline — 0% raised so campaign auto-fails
    advance_time(&s.env, days(31));

    // Try to donate after deadline — panics with "Campaign has failed"
    s.client.donate(&s.donor, &campaign_id, &100_0000000i128);
}

// ===== GET DONOR AMOUNT TEST =====

#[test]
fn test_get_donor_amount() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // No donation yet
    let amount_before = s.client.get_donor_amount(&campaign_id, &s.donor);
    assert_eq!(amount_before, 0);

    // After donation
    let donate_amount = 250_0000000i128;
    s.client.donate(&s.donor, &campaign_id, &donate_amount);

    let amount_after = s.client.get_donor_amount(&campaign_id, &s.donor);
    assert_eq!(amount_after, donate_amount);
}

// ===== WITHDRAW TESTS =====

#[test]
fn test_withdraw_successful_with_fee_deduction() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Donate full goal
    s.client.donate(&s.donor, &campaign_id, &goal);

    let treasury_balance_before = s.token_client.balance(&s.treasury);
    let organizer_balance_before = s.token_client.balance(&s.organizer);

    s.client.withdraw(&campaign_id);

    let treasury_balance_after = s.token_client.balance(&s.treasury);
    let organizer_balance_after = s.token_client.balance(&s.organizer);

    // Fee = 2.5% of 1000 XLM = 25 XLM
    let expected_fee = 25_0000000i128;
    let expected_organizer = goal - expected_fee; // 975 XLM

    assert_eq!(
        treasury_balance_after - treasury_balance_before,
        expected_fee
    );
    assert_eq!(
        organizer_balance_after - organizer_balance_before,
        expected_organizer
    );

    // Campaign should now be Successful
    let campaign = s.client.get_campaign(&campaign_id);
    assert!(matches!(campaign.status, CampaignStatus::Successful));
}

#[test]
#[should_panic]
fn test_withdraw_rejected_when_goal_not_met() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Only donate 50% of goal
    s.client.donate(&s.donor, &campaign_id, &500_0000000i128);

    // Try to withdraw — goal not met, should panic
    s.client.withdraw(&campaign_id);
}

// ===== CLAIM REFUND TESTS =====

#[test]
fn test_claim_refund_successful_on_failed_campaign() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    let donate_amount = 100_0000000i128; // 100 XLM (10% — campaign will fail)
    s.client.donate(&s.donor, &campaign_id, &donate_amount);

    let donor_balance_before = s.token_client.balance(&s.donor);

    // Advance past deadline — 10% raised so campaign auto-fails
    advance_time(&s.env, days(31));

    // Verify campaign is failed
    assert!(s.client.is_campaign_failed(&campaign_id));

    // Claim refund
    s.client.claim_refund(&s.donor, &campaign_id);

    let donor_balance_after = s.token_client.balance(&s.donor);
    assert_eq!(donor_balance_after - donor_balance_before, donate_amount);

    // Refund should be marked as claimed
    assert!(s.client.is_refund_claimed(&campaign_id, &s.donor));
}

#[test]
#[should_panic]
fn test_claim_refund_rejected_when_already_claimed() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    s.client.donate(&s.donor, &campaign_id, &100_0000000i128);

    // Advance past deadline — campaign fails
    advance_time(&s.env, days(31));

    // First refund — should succeed
    s.client.claim_refund(&s.donor, &campaign_id);

    // Second refund — should panic
    s.client.claim_refund(&s.donor, &campaign_id);
}

// ===== IS REFUND CLAIMED TEST =====

#[test]
fn test_is_refund_claimed() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    s.client.donate(&s.donor, &campaign_id, &100_0000000i128);
    advance_time(&s.env, days(31));

    // Not claimed yet
    assert!(!s.client.is_refund_claimed(&campaign_id, &s.donor));

    s.client.claim_refund(&s.donor, &campaign_id);

    // Now claimed
    assert!(s.client.is_refund_claimed(&campaign_id, &s.donor));
}

// ===== IS CAMPAIGN FAILED TESTS =====

#[test]
fn test_is_campaign_failed_under_70_at_deadline() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    assert!(!s.client.is_campaign_failed(&campaign_id));

    // Advance past deadline with 0 raised (0% < 70%)
    advance_time(&s.env, days(31));
    assert!(s.client.is_campaign_failed(&campaign_id));
}

#[test]
fn test_is_campaign_failed_action_window_expired() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Advance past deadline + 7 day action window
    advance_time(&s.env, days(38));
    assert!(s.client.is_campaign_failed(&campaign_id));
}

// ===== MARK AS FAILED TEST =====

#[test]
fn test_mark_as_failed_by_organizer() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    s.client.mark_as_failed(&campaign_id);
    assert!(s.client.is_campaign_failed(&campaign_id));
}

// ===== EXTEND DEADLINE TESTS =====

#[test]
#[should_panic]
fn test_extend_deadline_not_allowed_before_deadline() {
    let s = setup();
    let goal = 10_000_000_000_i128;
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Try to extend before deadline — should panic
    s.client.extend_deadline(&campaign_id);
}

#[test]
fn test_extend_deadline_allowed_after_deadline_with_70_percent() {
    let s = setup();
    let goal = 10_000_000_000_i128; // 1000 XLM
    let campaign_id = create_campaign_helper(&s, goal, 30);

    // Donate 70% of goal
    let amount = 700_0000000i128; // 700 XLM
    s.client.donate(&s.donor, &campaign_id, &amount);

    // Advance past deadline but within action window
    advance_time(&s.env, days(31));

    // Extend — should succeed since 70%+ raised
    s.client.extend_deadline(&campaign_id);

    let campaign = s.client.get_campaign(&campaign_id);
    assert!(campaign.extension_used);
}

// ===== ADMIN TESTS =====

#[test]
fn test_update_fee_percent() {
    let s = setup();
    s.client.update_fee_percent(&500u32); // change to 5%
    let settings = s.client.get_platform_settings();
    assert_eq!(settings.fee_basis_points, 500);
}

#[test]
fn test_update_treasury_wallet() {
    let s = setup();
    let new_treasury = Address::generate(&s.env);
    s.client.update_treasury_wallet(&new_treasury);
    let settings = s.client.get_platform_settings();
    assert_eq!(settings.treasury_wallet, new_treasury);
}

#[test]
fn test_update_action_window() {
    let s = setup();
    s.client.update_action_window(&14u32);
    let settings = s.client.get_platform_settings();
    assert_eq!(settings.action_window_days, 14);
}

#[test]
fn test_transfer_ownership() {
    let s = setup();
    let new_owner = Address::generate(&s.env);
    s.client.transfer_ownership(&new_owner);
    let settings = s.client.get_platform_settings();
    assert_eq!(settings.platform_owner, new_owner);
}
