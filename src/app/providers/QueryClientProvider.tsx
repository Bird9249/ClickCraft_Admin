import {
  QueryClient,
  QueryErrorResetBoundary,
  QueryClientProvider as RQProvider,
} from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      throwOnError: false,
    },
  },
});
export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryErrorResetBoundary>
      {() => <RQProvider client={queryClient}>{children}</RQProvider>}
    </QueryErrorResetBoundary>
  );
}
