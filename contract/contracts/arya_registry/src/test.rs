use super::*;
use soroban_sdk::testutils::Address as _;

fn make_config(env: &Env) -> RegistryConfig {
    RegistryConfig {
        owner: Address::generate(env),
        treasury: Address::generate(env),
        arya_token: Address::generate(env),
        xlm_token: Address::generate(env),
        usdc_token: Address::generate(env),
        staking_contract: Address::generate(env),
        crowdfunding_contract: Address::generate(env),
        launchpad_contract: Address::generate(env),
    }
}

#[test]
fn registry_updates_addresses() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AryaRegistry, ());
    let client = AryaRegistryClient::new(&env, &contract_id);

    let config = make_config(&env);
    client.initialize(&config);

    let new_treasury = Address::generate(&env);
    client.set_treasury(&new_treasury);

    let updated = client.get_config();
    assert_eq!(updated.treasury, new_treasury);

    let new_staking = Address::generate(&env);
    let new_crowdfunding = Address::generate(&env);
    let new_launchpad = Address::generate(&env);
    client.set_contracts(&new_staking, &new_crowdfunding, &new_launchpad);

    let updated = client.get_config();
    assert_eq!(updated.staking_contract, new_staking);
    assert_eq!(updated.crowdfunding_contract, new_crowdfunding);
    assert_eq!(updated.launchpad_contract, new_launchpad);
}
