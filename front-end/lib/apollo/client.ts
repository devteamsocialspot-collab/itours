"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { readSessionToken } from "@/lib/auth";
import { getActiveLocale } from "@/lib/i18n";

export function createApolloClient() {
  const httpLink = new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8080/graphql" });
  const authLink = setContext((_, { headers }) => {
    const token = readSessionToken();
    return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}), "x-locale": getActiveLocale() } };
  });
  return new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
    ssrMode: typeof window === "undefined", // no SSR data fetching: pages render loading state, then fetch on the client
  });
}
