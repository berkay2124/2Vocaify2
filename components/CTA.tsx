"use client";

import { useState, useEffect, useRef } from "react";

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-primary-600 to-indigo-700 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main CTA content */}
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Ready to transform your
            <br />
            hiring process?
          </h2>

          <p
            className={`text-xl sm:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Join hundreds of HR professionals who are already finding better candidates faster with Vocaify.
          </p>

          {/* CTA Button */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-primary-600 bg-white hover:bg-gray-50 rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
              <span>Start Your Free Trial</span>
              <svg
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          {/* Trust badges */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-6 text-indigo-100 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/10 backdrop-blur-sm text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload CVs</h3>
            <p className="text-indigo-100">
              Drag and drop your CV database. We support all major formats.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/10 backdrop-blur-sm text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Search Naturally</h3>
            <p className="text-indigo-100">
              Type what you&apos;re looking for in plain English. That&apos;s it.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/10 backdrop-blur-sm text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get Results</h3>
            <p className="text-indigo-100">
              Receive ranked, relevant candidates in under 2 seconds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
