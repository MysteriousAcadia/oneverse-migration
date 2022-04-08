const ethers = require("ethers")
const nftAbi = require('./721abi.json');
const stakingAbi = require('./staking.json');
const fs = require('fs');

const { Contract: MulticallContract, Provider: MulticallProvider } = require('ethers-multicall');
const MULTI_CALL_ADDRESS = "0x34b415f4d3b332515e66f70595ace1dcf36254c5";
const STAKING_ADDRESS = "0xFd3089C922fb9694ffC06b4c4cD0deBADF09CF94";
const MOLECULES_ADDRESS = "0xb44778bfe8a6c3468dcf7219fb104ba7e42f8d2a";
const PUFFS_ADDRESS= "0x870c0238e8779fe9f568dd1cc907fa449dbe8552";

const setupMultiCallContract = async (contractAddress, abi) => {
    
    const ethcallProvider = new MulticallProvider(new ethers.providers.StaticJsonRpcProvider(
        'https://rpc.hermesdefi.io/'
    ));

    await ethcallProvider.init();
    ethcallProvider._multicallAddress =
        MULTI_CALL_ADDRESS;

    const multicallContract = new MulticallContract(contractAddress, abi);
    return ([ethcallProvider, multicallContract]);

}
const main = async ()=>{
    const [provider, stakingContract] = await setupMultiCallContract(STAKING_ADDRESS,stakingAbi);
    const [_, moleculesContract] = await setupMultiCallContract(MOLECULES_ADDRESS,nftAbi);
    const [__, puffsContract] = await setupMultiCallContract(PUFFS_ADDRESS,nftAbi);
    const [t1,t2]  = await provider?.all([moleculesContract?.ownerOf("1"),puffsContract?.ownerOf("1")]);
    const moleculeTokenIds = Array.from({length:2222},(v,k)=>k+1);
    const moleculesJson = {}
    for (let i = 0; i < moleculeTokenIds?.length; i += 1000) {
        const tokens = moleculeTokenIds.slice(i, i + 1000);
        const results = await provider?.all(tokens.map(e=>moleculesContract?.ownerOf(e.toString())));
        results?.map((e,i)=>{
            moleculesJson[tokens[i].toString()] = e?.toString();
        })
    }
    fs.writeFile(`moleculeData.json`, JSON.stringify(moleculesJson),function(err, result) {
        if(err) console.log('error', err);
      });

    const puffsTokenIds = Array.from({length:8888},(v,k)=>k+1);
    const puffsJson = {}
    const listOfStakedNFTs = []
    for (let i = 0; i < puffsTokenIds?.length; i += 1000) {
        const tokens = puffsTokenIds.slice(i, i + 1000);
        const results = await provider?.all(tokens.map(e=>puffsContract?.ownerOf(e.toString())));
        results?.map((e,i)=>{
            puffsJson[tokens[i].toString()] = e?.toString();
            if(e?.toString().toLowerCase()==STAKING_ADDRESS?.toLowerCase()){
                listOfStakedNFTs?.push(tokens[i].toString())
            }
        })
    }
    console.log(listOfStakedNFTs)
    for(let i =0;i<listOfStakedNFTs?.length;i+=1000){
        const tokens = listOfStakedNFTs.slice(i, i + 1000);
        const results = await provider?.all(tokens.map(e=>stakingContract?.stakedTokens(e.toString())));
        results?.map((e,i)=>{
            puffsJson[tokens[i].toString()] = e[0].toString();
        })
    }

    fs.writeFile(`puffsData.json`, JSON.stringify(puffsJson),function(err, result) {
        if(err) console.log('error', err);
      });





}
main()