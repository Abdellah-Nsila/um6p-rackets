import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { clubKeys } from "@/hooks/use-clubs";
import {
    getDocuments,
    createDocument,
    deleteDocument,
    } from "@/lib/api/documents";

    export const documentKeys = {
    all: (slug: string) => [...clubKeys.detail(slug), "documents"] as const,
    lists: (slug: string) => [...documentKeys.all(slug), "list"] as const,
    };

    export function useClubDocuments(slug: string, enabled = true) {
    return useQuery({
        queryKey: documentKeys.lists(slug),
        queryFn: () => getDocuments(slug),
        enabled: enabled && Boolean(slug),
    });
    }

    export function useCreateDocument(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newDoc: { title: string; description: string; path: string }) =>
        createDocument(slug, newDoc),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(slug) });
        toast.success("Document added", {
            description: "Your new document is now available to members.",
        });
        },
        onError: (err: Error) => {
        toast.error("Failed to add document", {
            description: err.message || "An error occurred while adding the document.",
        });
        },
    });
    }

    export function useDeleteDocument(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (documentId: number) => deleteDocument(slug, documentId),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(slug) });
        toast.success("Document deleted", {
            description: "The document has been permanently removed.",
        });
        },
        onError: (err: Error) => {
        toast.error("Failed to delete", {
            description: err.message || "An error occurred while deleting the document.",
        });
        },
    });
}
