import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

interface CSVRow {
  'Index': string;
  'pNode Identity Pubkey': string;
  'Manager': string;
  'Registered Time': string;
  'Version': string;
}

interface ManagerNode {
  pubkey: string;
  registeredTime: string;
  version: string;
}

interface Manager {
  address: string;
  nodes: ManagerNode[];
  totalNodes: number;
  devnetNodes: number;
  mainnetNodes: number;
  activeNodes: number;
  lastRegistered: string;
}

export async function GET() {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'pnodesmanagers.csv');
    const fileContent = await fs.readFile(csvPath, 'utf-8');

    // Parse CSV
    const { data } = Papa.parse<CSVRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Fetch node data from both networks
    const devnetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pnodes?network=devnet`, {
      cache: 'no-store',
    });
    const mainnetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pnodes?network=mainnet`, {
      cache: 'no-store',
    });

    const devnetData = devnetRes.ok ? await devnetRes.json() : { data: [] };
    const mainnetData = mainnetRes.ok ? await mainnetRes.json() : { data: [] };

    const allNodes = [
      ...(devnetData.data || []).map((n: any) => ({ ...n, network: 'devnet' })),
      ...(mainnetData.data || []).map((n: any) => ({ ...n, network: 'mainnet' })),
    ];

    // Group by manager
    const managersMap = new Map<string, Manager>();

    data.forEach((row: { [x: string]: any; }) => {
      const manager = row['Manager'];
      const pubkey = row['pNode Identity Pubkey'];
      const registeredTime = row['Registered Time'];
      const version = row['Version'];

      if (!manager || !pubkey) return;

      if (!managersMap.has(manager)) {
        managersMap.set(manager, {
          address: manager,
          nodes: [],
          totalNodes: 0,
          devnetNodes: 0,
          mainnetNodes: 0,
          activeNodes: 0,
          lastRegistered: registeredTime,
        });
      }

      const managerData = managersMap.get(manager)!;
      managerData.nodes.push({
        pubkey,
        registeredTime,
        version,
      });
      managerData.totalNodes++;

      // Find node in fetched data
      const nodeData = allNodes.find((n: any) => n.pubkey === pubkey);
      if (nodeData) {
        if (nodeData.network === 'devnet') {
          managerData.devnetNodes++;
        } else {
          managerData.mainnetNodes++;
        }
        if (nodeData.status === 'active') {
          managerData.activeNodes++;
        }
      }

      // Update last registered
      if (new Date(registeredTime) > new Date(managerData.lastRegistered)) {
        managerData.lastRegistered = registeredTime;
      }
    });

    const managers = Array.from(managersMap.values());

    // Calculate stats
    const stats = {
      totalManagers: managers.length,
      totalNodes: managers.reduce((sum, m) => sum + m.totalNodes, 0),
      devnetNodes: managers.reduce((sum, m) => sum + m.devnetNodes, 0),
      mainnetNodes: managers.reduce((sum, m) => sum + m.mainnetNodes, 0),
      activeNodes: managers.reduce((sum, m) => sum + m.activeNodes, 0),
    };

    return NextResponse.json({
      success: true,
      data: managers,
      stats,
      allNodes,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch managers data' },
      { status: 500 }
    );
  }
}