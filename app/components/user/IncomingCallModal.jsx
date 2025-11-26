// components/user/IncomingCallModal.jsx
export default function IncomingCallModal({ onAccept, onReject }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Incoming Video Call</h3>
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium shadow-md"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium shadow-md"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}