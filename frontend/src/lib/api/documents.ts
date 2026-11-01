import { api } from '@/lib/api/api';
import type { ClubDocument } from '@/types/contracts/club';

const CLUBS = '/clubs';

export const getDocuments = async (slug: string) => {
    const res = await api<ClubDocument[] | { data: ClubDocument[] }>(`${CLUBS}/${slug}/documents`);
    return Array.isArray(res) ? res : (res.data || []);
    };

    export const createDocument = (
    slug: string, 
    newDoc: { title: string; description: string; path: string }
    ) =>
    api<ClubDocument>(`${CLUBS}/${slug}/documents`, {
        method: 'POST',
        body: JSON.stringify(newDoc),
    });

    export const deleteDocument = (slug: string, documentId: number) =>
    api<void>(`${CLUBS}/${slug}/documents/${documentId}`, {
        method: 'DELETE',
    });
