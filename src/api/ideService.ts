import axios from 'axios';
import apiClient from './apiClient';
import {
  CardDetail,
  Language,
  RunCodeResult,
  SubmissionHistory,
  SubmitResult,
} from '../types/ide';

/** Parse lỗi từ backend thành chuỗi dễ đọc */
const parseError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }
    if (err.code === 'ECONNABORTED')
      return 'Request timed out. The code may be in an infinite loop.';
    if (err.response?.status === 401)
      return 'You need to log in to submit code.';
    if (err.response?.status === 404) return 'Problem not found.';
    if (err.response?.status === 400)
      return 'Invalid request. Check your code or problem ID.';
    return `Server error (${err.response?.status ?? 'unknown'})`;
  }
  return err instanceof Error ? err.message : 'Unknown error';
};

export const ideApi = {
  /**
   * Lấy thông tin card (bài tập) theo ID
   */
  getCard: async (cardId: string): Promise<CardDetail> => {
    const res = await apiClient.get<CardDetail>(`/cards/${cardId}`);
    return res.data;
  },

  /**
   * Chạy code với public test cases (không lưu DB)
   */
  runCode: async (
    cardId: string,
    code: string,
    language: Language,
  ): Promise<RunCodeResult> => {
    try {
      const res = await apiClient.post<RunCodeResult>(
        '/submissions/run',
        {
          card_id: cardId,
          code,
          language,
        },
        { timeout: 90000 },
      );
      return res.data;
    } catch (err) {
      throw new Error(parseError(err));
    }
  },

  /**
   * Submit code đầy đủ (cần JWT token)
   */
  submitCode: async (
    cardId: string,
    submittedCode: string,
    language: Language,
  ): Promise<SubmitResult> => {
    try {
      const res = await apiClient.post<SubmitResult>(
        '/submissions/submit',
        {
          card_id: cardId,
          submitted_code: submittedCode,
          language,
        },
        { timeout: 90000 },
      );
      return res.data;
    } catch (err) {
      throw new Error(parseError(err));
    }
  },

  /**
   * Lấy lịch sử submission theo card + user
   */
  getSubmissions: async (
    cardId: string,
    userId: string,
  ): Promise<SubmissionHistory[]> => {
    const res = await apiClient.get<SubmissionHistory[]>('/submissions', {
      params: { card_id: cardId, user_id: userId },
    });
    return res.data;
  },
};
