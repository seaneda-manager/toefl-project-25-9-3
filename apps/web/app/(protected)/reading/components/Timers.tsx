'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
    seconds: number;
    /** Next 15 rule 71007: 함수 props는 *Action 접미사 권장 */
    onExpireAction?: () => void;
};

export default function Timer({ seconds, onExpireAction }: Props) {
    const [remaining, setRemaining] = useState<number>(seconds);
    const intervalRef = useRef<number | null>(null);

    // seconds 변경 시 타이머 재시작
    useEffect(() => {
        // 초기화
        setRemaining(seconds);
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 인터벌 시작
        intervalRef.current = window.setInterval(() => {
            setRemaining((s) => {
                if (s <= 1) {
                    // 마지막 틱에서 정리 + 콜백
                    if (intervalRef.current !== null) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    onExpireAction?.();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        // 언마운트/재시작 시 정리
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [seconds, onExpireAction]);

    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');

    return <div className="text-sm font-mono">{mm}:{ss}</div>;
}
