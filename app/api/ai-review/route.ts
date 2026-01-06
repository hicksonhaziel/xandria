import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodeData } = body; 

    if (!nodeData) {
      return NextResponse.json(
        { error: 'Node data is required' },
        { status: 400 }
      );
    }

    // environment variable
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // node data for analysis
    const details = nodeData.details?.result;
    const nodeInfo = {
      pubkey: nodeData.pubkey,
      credits: nodeData.credits || 0,
      rank: nodeData.rank || 'N/A',
      cpuUsage: details?.cpu_percent || 'N/A',
      ramUsage: details ? `${((details.ram_used / details.ram_total) * 100).toFixed(1)}%` : 'N/A',
      activeStreams: details?.active_streams || 'N/A',
      packetsReceived: details?.packets_received || 'N/A',
      packetsSent: details?.packets_sent || 'N/A',
      uptime: details?.last_updated || 'N/A',
    };

    const prompt = `You are XandExpert, an AI analyst for Xandeum network nodes. Analyze this node's performance and provide a brief, professional review (2-3 sentences max).

Node Data:
- Credits: ${nodeInfo.credits}
- Network Rank: ${nodeInfo.rank}
- CPU Usage: ${nodeInfo.cpuUsage}
- RAM Usage: ${nodeInfo.ramUsage}
- Active Streams: ${nodeInfo.activeStreams}
- Packets Received: ${nodeInfo.packetsReceived}
- Packets Sent: ${nodeInfo.packetsSent}

Provide a concise expert analysis focusing on: performance trends, potential issues, and a brief recommendation. Keep it under 50 words, also if a node information is not provided completely(just know its a private node).`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are XandExpert, a professional blockchain node analyst. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || 'Unable to generate analysis.';

    return NextResponse.json({ review });

  } catch (error) {
    console.error('AI Review Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate AI review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}