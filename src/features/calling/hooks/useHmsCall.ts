import { useCallback, useEffect, useRef } from 'react';
import {
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import {
  selectIsConnectedToRoom,
  selectPeers,
  selectLocalPeer,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectRoomState,
} from '@100mslive/hms-video-store';

/**
 * Hook to manage 100ms room lifecycle.
 * Joins/leaves room based on token, exposes peers, track toggles.
 */
export function useHmsCall() {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const roomState = useHMSStore(selectRoomState);
  const joinedRef = useRef(false);

  const join = useCallback(async (token: string, userName: string) => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    try {
      await hmsActions.join({
        authToken: token,
        userName,
        settings: {
          isAudioMuted: false,
          isVideoMuted: false,
        },
      });
    } catch (err) {
      joinedRef.current = false;
      throw err;
    }
  }, [hmsActions]);

  const leave = useCallback(async () => {
    joinedRef.current = false;
    try {
      await hmsActions.leave();
    } catch {
      // ignore leave errors
    }
  }, [hmsActions]);

  const toggleAudio = useCallback(async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
  }, [hmsActions, isAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
  }, [hmsActions, isVideoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (joinedRef.current) {
        hmsActions.leave().catch(() => {});
        joinedRef.current = false;
      }
    };
  }, [hmsActions]);

  const remotePeers = peers.filter((p) => !p.isLocal);

  return {
    join,
    leave,
    isConnected,
    roomState,
    localPeer,
    remotePeers,
    peers,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    isReconnecting: roomState === 'Reconnecting',
  };
}
