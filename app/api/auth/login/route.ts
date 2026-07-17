import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    const { username, password } = await req.json();

    if (username !== ADMIN_USERNAME) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = password === ADMIN_PASSWORD;
    if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });

    return NextResponse.json({ token });
}