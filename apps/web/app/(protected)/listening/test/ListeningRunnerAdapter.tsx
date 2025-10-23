// normalized utf8
'use client';

import ListeningTestRunner from './ListeningTestRunner';
import type { Passage } from '@/types/test';

export default function ListeningRunnerAdapter({
  passage,
  audioUrl,            // ���� Runner������ ������� ������, ���� AudioPanel � �� �� �־� ���ܵ�
  onFinish,            // Runner �ñ״�ó�� ��� �������� ���� (�ʿ�� Runner ���� prop �߰�)
}: {
  passage: Passage;
  audioUrl: string;
  onFinish?: (sessionId: string) => void;
}) {
  // Passage -> initialSetId ���� (setId�� ������ �켱, ������ id ���)
  const initialSetId = (passage as any).setId ?? passage.id;

  return (
    <ListeningTestRunner
      initialSetId={initialSetId}
      autoStart
      debug={false}
    />
  );
}
