'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Feedback } from '@/types';

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'DSA';
  const difficulty = searchParams.get('difficulty') || '3';

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    // Mock session creation
    setSessionId(1);
    loadNextQuestion();
  };

  const loadNextQuestion = async () => {
    setIsLoading(true);
    // Mock question loading
    setTimeout(() => {
      const questions = {
        DSA: 'Explain how you would implement a function to find the longest palindromic substring in a given string.',
        HR: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?'
      };
      setCurrentQuestion(questions[mode as keyof typeof questions]);
      setIsLoading(false);
      setFeedback(null);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // In real implementation, send to backend for transcription
        setTranscript('This is a mock transcript of your answer...');
        submitAnswer('This is a mock transcript of your answer...');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record your answer.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setIsRecording(false);
    }
  };

  const submitAnswer = async (text: string) => {
    setIsLoading(true);
    // Mock evaluation
    setTimeout(() => {
      setFeedback({
        composite_score: 3.8,
        strengths: ['Clear communication', 'Good problem understanding'],
        improvements: ['Add complexity analysis', 'Provide more specific examples'],
        dimension_scores: {
          dimension_1: 4.0,
          dimension_2: 3.5,
          dimension_3: 4.0,
          dimension_4: 3.5,
          dimension_5: 4.0
        }
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{mode} Interview</h1>
            <span className="text-sm text-gray-500">Session #{sessionId}</span>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-2">Question:</h2>
                <p className="text-gray-800">{currentQuestion}</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-center">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="bg-red-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <span className="w-4 h-4 bg-white rounded-full"></span>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-900 transition"
                    >
                      Stop Recording
                    </button>
                  )}
                </div>
                {isRecording && (
                  <p className="text-center mt-4 text-red-500 animate-pulse">Recording...</p>
                )}
              </div>

              {transcript && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-2">Your Answer:</h3>
                  <p className="text-gray-700">{transcript}</p>
                </div>
              )}

              {feedback && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-bold mb-4">Feedback</h2>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Score:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {feedback.composite_score.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
                      <ul className="list-disc list-inside text-green-700">
                        {feedback.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h3 className="font-semibold text-amber-800 mb-2">Areas to Improve</h3>
                      <ul className="list-disc list-inside text-amber-700">
                        {feedback.improvements.map((imp: string, i: number) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={loadNextQuestion}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Next Question
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
