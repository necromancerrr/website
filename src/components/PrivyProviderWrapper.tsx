"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { Fragment } from "react";

export default function PrivyProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
            config={{
                // Appearance
                appearance: {
                    theme: "dark",
                    accentColor: "#6f58da",
                    logo: "/images/UWBLOGO.png",
                },
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                },
                // Login methods
                loginMethods: ["email", "wallet"],
            }}
        >
            <Fragment>{children}</Fragment>
        </PrivyProvider>
    );
}
