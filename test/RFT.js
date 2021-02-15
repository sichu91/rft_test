const { time } = require('@openzeppelin/test-helpers');
const RFT = artifacts.require('RFT.sol')
const NFT = artifacts.require('NFT.sol')
const DAI = artifacts.require('DAI.sol')

// easily interact with ethereum
const DAI_AMOUNT = web3.utils.toWei('25000');
const SHARE_AMOUNT = web3.utils.toWei('25000');

contract('RFT', async addresses => { // async callback
  const [admin, buyer1, buyer2, buyer3, buyer4, _] = addresses;

  // individual test
  it('ICO should work', async () => {
    const dai = await DAI.new();
    const nft = await NFT.new('My awesome NFT', 'NFT');
    await nft.mint(admin, 1) // token id would be 1: admin will buy this nft from some exchange
    await Promise.all([
      dai.mint(buyer1, DAI_AMOUNT),
      dai.mint(buyer2, DAI_AMOUNT),
      dai.mint(buyer3, DAI_AMOUNT),
      dai.mint(buyer4, DAI_AMOUNT),
    ]);

    // transfer the nft from the admin to the rft contract
    const rft = await RFT.new(
      'My awesome RFT',
      'RFT',
      nft.address,
      1, // token id
      1, // how many die token needed for one share
      web3.utils.toWei('100000'), // total supply for the share of the rft
      dai.address // address of dai
    );
    // 위의 transfer가 token을 가져갈 수 있게 승인
    await nft.approve(rft.address, 1); // 1은 token id
    await rft.startIco(); // rft start ICO

    // DAI 토큰이 rft에게 소비될 수 있도록 approve
    await dai.approve(rft.address, DAI_AMOUNT, {from: buyer1}); // {from: buyer}: buyer send this transaction
    await rft.buyShare(SHARE_AMOUNT, {from:buyer1});
    await dai.approve(rft.address, DAI_AMOUNT, {from: buyer2});
    await rft.buyShare(SHARE_AMOUNT, {from:buyer2});
    await dai.approve(rft.address, DAI_AMOUNT, {from: buyer3});
    await rft.buyShare(SHARE_AMOUNT, {from:buyer3});
    await dai.approve(rft.address, DAI_AMOUNT, {from: buyer4});
    await rft.buyShare(SHARE_AMOUNT, {from:buyer4});

    await time.increase(7 * 86400 + 1);
    await rft.withdrawIcoProfits(); // withdraw the profit for the admin
    
    // test wheter all the token balance are correct
    const balanceShareBuyer1 = await rft.balanceOf(buyer1);
    const balanceShareBuyer2 = await rft.balanceOf(buyer2);
    const balanceShareBuyer3 = await rft.balanceOf(buyer3);
    const balanceShareBuyer4 = await rft.balanceOf(buyer4);
    assert(balanceShareBuyer1.toString() === SHARE_AMOUNT);
    assert(balanceShareBuyer2.toString() === SHARE_AMOUNT);
    assert(balanceShareBuyer3.toString() === SHARE_AMOUNT);
    assert(balanceShareBuyer4.toString() === SHARE_AMOUNT);
    // check that admin has all the dai token
    // admin is the one who spent money initally to buy the nft token
    const balanceAdminDai = await dai.balanceOf(admin);
    assert(balanceAdminDai.toString() === web3.utils.toWei('100000'))
  });
});
