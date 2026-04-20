import type { D1Database, SfProperties, ExecutionContext } from "@cloudflare/workers-types";

declare global {
    namespace App {
        interface Locals {
            // This is the object that will be available as event.locals.user
            user: {
                id: number;
                invited_by: number | null;
                userId: number;
                first_name: string;
                last_name: string;
                username: string | null;
                language_code: string;
                is_premium: string | null;
                photo_url: string | null;
                created_at: string;
                broadcast: boolean;
            };

            balance: {
                value: number
            };

            agent: {
                name: string | null;
                avatar: string | null;
                agentClass: string | null;
                speciality: string | null;
                dateCreated: Date | null;
                lastUpdated: Date | null;
            }
        }

        interface Window {
            Telegram: {
                WebApp: {
                    initData: string;
                };
            };
        }

        interface Platform {}
    }
}

export {};