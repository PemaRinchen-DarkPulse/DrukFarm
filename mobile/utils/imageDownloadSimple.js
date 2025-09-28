// Simple helpers focused on saving images in Expo Go without requesting AUDIO permission
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let __mediaPermGranted = null; // cache permission result for this session

/**
 * Ensure we have permission to save images to the Media Library.
 * - In Expo Go, we cannot modify AndroidManifest, so avoid requesting AUDIO/VIDEO.
 * - We try to request add-only/image-focused permissions to prevent AUDIO permission errors.
 * Returns { granted: boolean, response?: any }
 */
export async function ensureMediaLibraryImagePermission(options = {}) {
	try {
		// Return cached result if already granted in this session
		if (__mediaPermGranted === true) {
			return { granted: true, cached: true };
		}
		// First, check existing perms
		const current = await MediaLibrary.getPermissionsAsync();
		if (current?.status === 'granted') {
			__mediaPermGranted = true;
			return { granted: true, response: current };
		}

		// Optional bypass: in Expo Go we can skip explicit prompt and let createAssetAsync trigger a system dialog
		// This works for both iOS and Android in Expo Go
		if (options?.bypassInExpoGo && Constants?.appOwnership === 'expo') {
			console.log('Bypassing permission check in Expo Go');
			return { granted: true, bypassed: true };
		}

		// Attempt to request minimal privileges – addOnly (write-only) to images
		// Different SDKs accept different shapes; we try modern first, then legacy fallbacks
		try {
			const resp = await MediaLibrary.requestPermissionsAsync({ accessPrivileges: 'addOnly' });
			if (resp?.status === 'granted') { __mediaPermGranted = true; return { granted: true, response: resp }; }
			// On some SDKs, accessPrivileges may not be supported. Fall through to legacy.
		} catch (e) {
			// ignore and try legacy path
		}

		// Legacy API (older Expo SDKs) with boolean write-only flag
		try {
			const resp = await MediaLibrary.requestPermissionsAsync(true);
			if (resp?.status === 'granted') { __mediaPermGranted = true; return { granted: true, response: resp }; }
		} catch (e2) {
			// ignore
		}

		// As a last resort, do a plain request (may fail in Expo Go if it asks for AUDIO)
		const resp = await MediaLibrary.requestPermissionsAsync();
		const ok = resp?.status === 'granted';
		if (ok) __mediaPermGranted = true;
		return { granted: ok, response: resp };
	} catch (error) {
		return { granted: false, error };
	}
}

/**
 * Backward-compat export used in some screens.
 * Kept for existing imports that expect a function named downloadOrderImageToGallery.
 * You should call the API/download logic elsewhere; this only ensures permissions.
 */
export async function downloadOrderImageToGallery(/* orderId */) {
	const perm = await ensureMediaLibraryImagePermission();
	return perm.granted;
}
