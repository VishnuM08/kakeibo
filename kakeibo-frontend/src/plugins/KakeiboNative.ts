import { registerPlugin } from "@capacitor/core";

/**
 * KakeiboNative Capacitor Plugin
 * 
 * Provides bridge to Android native features for:
 * - SMS Permission checking & requesting
 * - Pending SMS retrieval (from cold start or notification)
 */
export const KakeiboNative = registerPlugin<any>('KakeiboNative');
