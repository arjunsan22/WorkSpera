// components/user/VideoCallModal.jsx
export default function VideoCallModal({ localStream, remoteStream, onHangUp }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <video
              autoPlay
              muted
              playsInline
              ref={(video) => {
                if (video && localStream) video.srcObject = localStream;
              }}
              className="w-full h-64 md:h-80 object-cover"
            />
            <p className="text-white text-center py-2 text-sm">You</p>
          </div>

          {/* Remote */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {remoteStream ? (
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video) video.srcObject = remoteStream;
                }}
                className="w-full h-64 md:h-80 object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-80 flex items-center justify-center text-gray-500">
                Connecting...
              </div>
            )}
            <p className="text-white text-center py-2 text-sm">Friend</p>
          </div>
        </div>

        <button
          onClick={onHangUp}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full shadow-lg"
        >
          End Call
        </button>
      </div>
    </div>
  );
}