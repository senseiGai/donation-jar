import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abiJson from "../../../abi/DonationJar.json";

const CONTRACT_ADDRESS = "0x8def9A62A963e466EFB47EDaA77e21D21Bfb5495";

export default function AccountCard() {
  const [address, setAddress] = useState("");
  const [nickname, setNickname] = useState("");
  const [rank, setRank] = useState("None");
  const [totalDonated, setTotalDonated] = useState("0");

  const fetchAccountData = async () => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    setAddress(userAddress);

    // Nickname via ENS reverse lookup (optional)
    try {
      const ensName = await provider.lookupAddress(userAddress);
      setNickname(ensName ?? "");
    } catch {
      setNickname("");
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, provider);
    const donated = await contract.totalDonated(userAddress);
    setTotalDonated(ethers.formatEther(donated));

    const userRank = await contract.getRank(userAddress);
    setRank(Object.keys(RANK_MAP)[userRank]);
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const RANK_MAP = {
    0: "None",
    1: "Supporter",
    2: "Donator",
    3: "Patron",
    4: "Whale",
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">👤 My Account</h2>

      <div className="mb-3">
        <span className="font-semibold text-gray-400">Address:</span>
        <div className="break-all text-sm">{address}</div>
      </div>

      {nickname && (
        <div className="mb-3">
          <span className="font-semibold text-gray-400">Nickname:</span>{" "}
          {nickname}
        </div>
      )}

      <div className="mb-3">
        <span className="font-semibold text-gray-400">Total Donated:</span>{" "}
        <span className="text-green-400">{totalDonated} ETH</span>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-gray-400">Rank:</span>{" "}
        <span className="text-yellow-400">{rank}</span>
      </div>
    </div>
  );
}
