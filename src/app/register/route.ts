// src/app/api/user/register/route.ts
import dbConnect from '@/lib/dbConnect';
import Voter from '@/models/Voter';

export async function POST(req: Request) {
  await dbConnect();

  const { name, walletAddress, studentId } = await req.json();

  if (!name || !walletAddress) {
    return new Response(
      JSON.stringify({ success: false, message: 'name, walletAddress 필수' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const voter = await Voter.create({ name, walletAddress, studentId });
    return new Response(JSON.stringify({ success: true, data: voter }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return new Response(
        JSON.stringify({ success: false, message: '이미 등록된 지갑입니다.' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
