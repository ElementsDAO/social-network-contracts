const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../scripts/utils.js");

describe("RateControl", function () {

    let rate_control;

    it("Deploy contract", async function () {
        rate_control = await utils.deploy_proxy("RateControl");
    });

    it("Addresses cannot perform actions by default", async function () {
        utils.expect_error_message(async () => {
            await rate_control.perform_action();
        }, "you already reached your rate limit");
    });

    it("Address can perform actions after rate control increased", async function () {
        await rate_control.set_account_rate_limit(utils.own_address(), 2);
        await rate_control.perform_action();
        await rate_control.perform_action();
    });

    it("Address cannot perform actions beyond rate limit", async function () {
        utils.expect_error_message(async () => {
            await rate_control.perform_action();
        }, "you already reached your rate limit");
    });

    it("Rate limit available again after interval passes", async function () {
        await network.provider.send("evm_increaseTime", [20*60])
        await rate_control.perform_action();
        await rate_control.perform_action();
        utils.expect_error_message(async () => {
            await rate_control.perform_action();
        }, "you already reached your rate limit");
    });

    it("Rate is account-specific", async function () {
        await network.provider.send("evm_increaseTime", [20*60])


        const [signer0, signer1] = await ethers.getSigners();
        let rate_control_as_signer0 = await rate_control.connect(signer0);
        let rate_control_as_signer1 = await rate_control.connect(signer1);

        utils.expect_error_message(async () => {
            await rate_control_as_signer1.perform_action();
        }, "you already reached your rate limit");
        await rate_control_as_signer0.perform_action();
        await rate_control_as_signer0.perform_action();

        await rate_control.set_account_rate_limit(signer1.address, 2);

        await rate_control_as_signer1.perform_action();
        await rate_control_as_signer1.perform_action();
        utils.expect_error_message(async () => {
            await rate_control_as_signer1.perform_action();
        }, "you already reached your rate limit");
        utils.expect_error_message(async () => {
            await rate_control_as_signer0.perform_action();
        }, "you already reached your rate limit");
    });
});