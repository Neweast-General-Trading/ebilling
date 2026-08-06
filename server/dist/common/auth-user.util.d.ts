export interface AuthActor {
    email: string;
    name: string | null;
}
export declare function getAuthActor(user: unknown): AuthActor;
