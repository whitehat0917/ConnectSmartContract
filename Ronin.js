const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const ethers = require('ethers');
const fs = require('fs');
const auctionABI = JSON.parse(fs.readFileSync('./axie.json', 'utf8'));
const roninUrl = 'https://api.roninchain.com/rpc';
const WETH = '';
const axieAddress = '';
const contractAddress = '';

const privateKey = 'private key';
const walletAddress = 'your wallet address';
const itemId = 913926 //ItemId - default: 913926

async function main() {
    const provider = new Provider(privateKey, roninUrl);
    // console.log(provider)
    const web3 = new Web3(provider,56);
    const auction_contract = new web3.eth.Contract(auctionABI, contractAddress);
    await web3.eth.getAccounts(function (err, accounts) {
        console.log('Ronin wallet Address', accounts[0])
        // web3.eth.getBalance(walletAddress).then(console.log)
        // console.log(web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0].toString().toLowerCase())));
        if (err != null) console.error("An error occurred: " + err);
        else if (accounts.length == 0) console.log("User is not logged in to Ronin Wallet");
        else console.log("User is logged in to Ronin Wallet");
    });
    
    auction_contract.methods.getTokenAuctions(axieAddress, itemId).call().then(async result => {
        if (result._sellers.length > 0) {
            const sellerAddress = result._sellers[0]
            const listingIndex = result._listingIndexes[0]
            console.log('itemId:',itemId, 'seller:', sellerAddress, 'listingIndex:',listingIndex)
            auction_contract.methods.getCurrentPrices(sellerAddress, listingIndex).call().then(async result => {
                const bidAmount = result[1][0]
                const Slippage = web3.utils.toBN(bidAmount)
                console.log('currentPrice:', bidAmount/1000000000000000000)
                const settleAuction = await auction_contract.methods.settleAuction(sellerAddress, WETH, bidAmount, listingIndex);

                const encodedABI = await settleAuction.encodeABI();
                console.log(encodedABI)
                const tx = {
                    from: walletAddress,
                    to: contractAddress,
                    data: encodedABI,
                    gas: '100000000',
                    gasprice:0
                };
                // console.log(web3.eth.accounts)
                web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
                    // console.log(signed)
                    var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);

                    tran.on('confirmation', (confirmationNumber, receipt) => {
                        console.log('confirmation: ' + confirmationNumber);
                        console.log(receipt);
                    });

                    tran.on('transactionHash', hash => {
                        console.log('hash');
                        console.log(hash);
                    });

                    tran.on('receipt', receipt => {
                        console.log('receipt');
                        console.log(receipt);
                    });

                    tran.on('error', console.error);
                });
            });
        } else {
            console.log("Current Axie is no longer available.");
        }

    });
}

main();
