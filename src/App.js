import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json"

export default function App() {
    const [currentAccount, setCurrentAccount] = useState("");
    const [currCount, setCurrCount] = useState(0);
    const [allWaves, setAllWaves] = useState([]);
    const [message, setMessage] = useState(null);
    const contractAddress = "0x30895bF7Ad28D83D185d55bfa5F79eA6CDDa6A81"
    const contractABI = abi.abi

    const input = useRef(null)

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                console.log("Make sure you have metamask!");
                return;
            } else {
                console.log("We have the ethereum object", ethereum);
            }

            /*
            * Check if we're authorized to access the user's wallet
            */
            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length !== 0) {
                const account = accounts[0];
                console.log("Found an authorized account:", account);
                setCurrentAccount(account)
                getAllWaves()
            } else {
                console.log("No authorized account found")
            }
        } catch (error) {
            console.log(error);
        }
    }

    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });

            console.log("Connected", accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error)
        }
    }

    const loadWaveCount = async () => {
        try {
            const { ethereum } = window;

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
                let count = await wavePortalContract.getTotalWaves();
                setCurrCount(+count)
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (e) { console.log(e) }
    }

    const wave = async () => {
        try {
            const { ethereum } = window;

            if (ethereum) {
                if (!message) {
                    alert("Please enter a message!")
                    return;
                }

                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

                let count = await wavePortalContract.getTotalWaves();
                setCurrCount(+count)
                console.log("Retrieved total wave count...", count.toNumber());

                /*
                * Execute the actual wave from your smart contract
                */
                const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
                console.log("Mining...", waveTxn.hash);

                await waveTxn.wait();
                console.log("Mined -- ", waveTxn.hash);

                count = await wavePortalContract.getTotalWaves();
                setCurrCount(+count)
                console.log("Retrieved total wave count...", count.toNumber());
            } else {
                console.log("Ethereum object doesn't exist!");
                alert("Please connect Wallet first.")
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function getAllWaves() {
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

                /*
                 * Call the getAllWaves method from your Smart Contract
                 */
                const waves = await wavePortalContract.getAllWaves();


                /*
                 * We only need address, timestamp, and message in our UI so let's
                 * pick those out
                 */
                let wavesCleaned = [];
                waves.forEach(wave => {
                    wavesCleaned.push({
                        address: wave.waver,
                        timestamp: new Date(wave.timestamp * 1000),
                        message: wave.message
                    });
                });

                setAllWaves(wavesCleaned);

                wavePortalContract.on("NewWave", (from, timestamp, message) => {
                    console.log("NewWave", from, timestamp, message);

                    setAllWaves(prevState => [...prevState, {
                        address: from,
                        timestamp: new Date(timestamp * 1000),
                        message: message
                    }]);
                });
            } else {
                console.log("Ethereum object doesn't exist!")
            }

        } catch (error) {
            console.log(error);
        }
    }

    const handleText = (e) => {
        setMessage(e.target.value)
    }

    useEffect(() => {
        checkIfWalletIsConnected();
        loadWaveCount()
    }, [])

    return (
        <div className="mainContainer">
            <div className="dataContainer">
                <div className="header">
                    <span role="img" aria-label="waving" >👋 Hey there!</span>
                </div>

                <div className="bio">
                    I am Sai Sridhar and I worked with NextJS and Django so that's pretty cool right? Connect your Ethereum wallet and wave at me!
                </div>

                <input ref={input} type="text" placeholder="Enter a message or share a link!" onChange={(e) => handleText(e)} />

                <button className="waveButton" onClick={wave}>
                    Wave at Me
                </button>
                {!currentAccount && (
                    <button className="waveButton" style={{ backgroundColor: "red", color: "whitesmoke" }} onClick={connectWallet}>
                        Connect Wallet
                    </button>
                )}
                <p className="wave">Wave Count: <b>{currCount}</b></p>
                {allWaves.map((wave, index) => {
                    return (
                        <div key={index} className="boxes">
                            <div><b>Address:</b> {wave.address}</div>
                            <div><b>Time:</b> {wave.timestamp.toString()}</div>
                            <div><b>Message:</b> {wave.message}</div>
                        </div>)
                })}
            </div>
        </div>
    );
}
