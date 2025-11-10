// lib/services/db.service.ts

import { getClientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const MAX_CONFIRMATIONS = 2; // 최대 확인 횟수 상수를 서비스로 이동

/**
 * 이벤트 동기화 및 확인 로직을 처리합니다.
 */
export async function syncEventAndConfirm(eventId: string, requestId: string, uri: string) {
    const client = await getClientPromise(uri);
    const db = client.db("voting_db");
    const collection = db.collection("events");

    // 1. 기존 이벤트 확인 (eventId 기준)
    const existingEvent = await collection.findOne({ eventId: eventId });

    if (existingEvent) {
        // 2. 재확인 처리 (Confirmation Count 증가)
        let currentConfirmations = existingEvent.confirmationCount || 0;

        if (currentConfirmations >= MAX_CONFIRMATIONS) {
            // 이미 최종 확인 완료된 경우
            return { status: 'FINALIZED', confirmationCount: MAX_CONFIRMATIONS };
        }

        // 확인 횟수 증가 및 DB 업데이트
        currentConfirmations += 1;

        const newStatus = currentConfirmations === MAX_CONFIRMATIONS ? 'CONFIRMED' : 'PENDING';

        await collection.updateOne(
            { eventId: eventId },
            {
                $set: {
                    confirmationCount: currentConfirmations,
                    lastConfirmedAt: new Date(),
                    status: newStatus,
                    [`requestId_${currentConfirmations}`]: requestId
                }
            }
        );

        return { status: newStatus, confirmationCount: currentConfirmations };

    } else {
        // 3. 새로운 이벤트 등록 (초기 1회 확인)
        const newEventData = {
            eventId: eventId,
            createdAt: new Date(),
            confirmationCount: 1,
            lastConfirmedAt: new Date(),
            status: 'PENDING',
            requestId_1: requestId
        };

        await collection.insertOne(newEventData);

        return { status: 'PENDING', confirmationCount: 1 };
    }
}