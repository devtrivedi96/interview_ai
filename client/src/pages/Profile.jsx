import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import PreferencesModal from '../components/PreferencesModal'
import { User, Edit2 } from 'lucide-react'

export default function Profile() {
  const { user } = useAuthStore()
  const { preferences, preferencesExists, fetchPreferences } = useProfileStore()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      await fetchPreferences()
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        {/* User Information */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{user?.email}</h2>
              <p className="text-gray-600 text-sm">
                {new Date(user?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Email Verified</p>
              <p className="font-medium text-gray-900">
                {user?.email_verified ? 'Yes ✓' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Audio Consent</p>
              <p className="font-medium text-gray-900">
                {user?.audio_consent ? 'Yes ✓' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Interview Preferences */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Interview Preferences</h2>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {preferencesExists ? 'Edit Preferences' : 'Set Preferences'}
            </button>
          </div>

          {preferencesExists && preferences ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Tech Stack</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.tech_stack?.map(tech => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Preferred Roles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.preferred_roles?.map(role => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Experience Level</p>
                <p className="mt-1 font-medium text-gray-900 capitalize">
                  {preferences.experience_level}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Target Company Type</p>
                <p className="mt-1 font-medium text-gray-900 capitalize">
                  {preferences.target_company_type?.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Preferred Interview Modes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.preferred_interview_modes?.map(mode => (
                    <span
                      key={mode}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              {preferences.updated_at && (
                <p className="text-gray-500 text-xs pt-4 border-t border-gray-200">
                  Last updated: {new Date(preferences.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You haven't set your interview preferences yet.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Set Preferences Now
              </button>
            </div>
          )}
        </div>
      </div>

      <PreferencesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={preferences}
      />
    </>
  )
}
