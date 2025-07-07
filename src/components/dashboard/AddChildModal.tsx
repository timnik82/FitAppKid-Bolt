import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Baby, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AddChildModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddChildModal: React.FC<AddChildModalProps> = ({ onClose, onSuccess }) => {
  const { addChild } = useAuth();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentConsent, setParentConsent] = useState(false);
  const [privacyAcknowledge, setPrivacyAcknowledge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const calculateDateOfBirth = (age: string) => {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - parseInt(age);
    return `${birthYear}-01-01`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!childName.trim()) {
      setError('Child name is required');
      setLoading(false);
      return;
    }

    if (!childAge || parseInt(childAge) < 5 || parseInt(childAge) > 17) {
      setError('Child age must be between 5 and 17 years old');
      setLoading(false);
      return;
    }

    if (!parentConsent) {
      setError('Parental consent is required for COPPA compliance');
      setLoading(false);
      return;
    }

    if (!privacyAcknowledge) {
      setError('Privacy acknowledgment is required');
      setLoading(false);
      return;
    }

    try {
      const dateOfBirth = calculateDateOfBirth(childAge);
      await addChild(childName.trim(), dateOfBirth);
      setSuccess('Child profile created successfully!');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Baby className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Child Profile</h2>
              <p className="text-sm text-gray-600">COPPA-compliant child account creation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Child Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter child's name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name only - no full legal names required
              </p>
            </div>

            {/* Child Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Age
              </label>
              <select
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select age</option>
                {Array.from({ length: 13 }, (_, i) => i + 5).map(age => (
                  <option key={age} value={age}>
                    {age} years old
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Age 5-17 supported for child safety
              </p>
            </div>

            {/* COPPA Consent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">COPPA Parental Consent</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    By creating this child profile, you consent to the collection and use of your child's 
                    information as described in our privacy policy. This app is designed to be COPPA compliant.
                  </p>
                  
                  <div className="text-sm text-blue-800 mb-3">
                    <p className="font-medium mb-1">Data we collect:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Child's display name and age</li>
                      <li>• Exercise activity and duration</li>
                      <li>• Fun ratings and adventure progress</li>
                      <li>• No health data, location, or personal information</li>
                    </ul>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="parentConsent"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="parentConsent" className="text-sm text-blue-800">
                      <strong>I give my consent</strong> as this child's parent/guardian to create 
                      this account and collect the information described above.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Acknowledgment */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privacyAcknowledge"
                checked={privacyAcknowledge}
                onChange={(e) => setPrivacyAcknowledge(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="privacyAcknowledge" className="text-sm text-gray-700">
                I understand that I can view, modify, or delete my child's data at any time, 
                and that this app prioritizes my child's privacy and safety.
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !parentConsent || !privacyAcknowledge}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Child Profile'}
              </button>
            </div>
          </form>

          {/* Technical Details */}
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Technical:</strong> Child profiles are created with user_id = NULL and linked to your parent account 
              through the parent_child_relationships table. All data access is controlled by Row Level Security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChildModal;