import { CareerModule, TargetJob, GeneratedContent } from '../types';

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
};

export const parseLinkedInProfile = async (
  rawText: string
): Promise<Partial<CareerModule>[]> => {
  if (!rawText.trim()) return [];
  return postJson<Partial<CareerModule>[]>('/api/parse-linkedin', { rawText });
};

export const generateApplicationMaterials = async (
  modules: CareerModule[],
  job: TargetJob
): Promise<GeneratedContent> => {
  return postJson<GeneratedContent>('/api/generate', { modules, job });
};
