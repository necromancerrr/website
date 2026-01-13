import React from 'react';
import { ArrowRight, Code, Terminal, Cpu, Globe } from 'lucide-react';
import Link from 'next/link';
import TypewriterText from '@/components/TypewriterText';

export default function EngineeringPage() {
    return (
        <main className="min-h-screen bg-black text-white font-body selection:bg-electric selection:text-white">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 text-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
                <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fadeIn">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-electric/30 bg-electric/10 text-electricAlt text-sm font-mono mb-4">
                        <Terminal className="w-4 h-4 mr-2" />
                        <span>UW Blockchain Engineering</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight leading-tight">
                        Building the <TypewriterText text="Decentralized Future." />
                    </h1>

                    <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto">
                        The Engineering Branch of UW Blockchain. We don&apos;t just speculate; we ship real projects.
                    </p>

                    <div className="pt-4">
                        <Link
                            href="https://docs.google.com/forms/d/e/1FAIpQLSfxNK9CgnIwdQzpx3_ckLAjJc6RiyTZjzjYjmnLAaxzpDpYXA/viewform?usp=dialog"
                            target="_blank"
                            className="inline-flex items-center px-8 py-4 bg-electric hover:bg-electricAlt text-white font-bold rounded-lg transition-all duration-300 shadow-glow hover:scale-105"
                        >
                            Join the Builders
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 px-6 bg-black relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-heading font-bold">
                                Shipping <span className="text-electric">Real Projects</span>
                            </h2>
                            <p className="text-lg text-muted leading-relaxed">
                                We function as a dev shop and research hub. From infrastructure to dApps, we build production-grade software on-chain. Our engineers are at the forefront of the industry, contributing to major protocols and launching their own ventures.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-electric/50 transition-colors">
                                    <Cpu className="w-8 h-8 text-electric mb-3" />
                                    <h3 className="font-bold text-lg mb-1">Infrastructure</h3>
                                    <p className="text-sm text-muted">Validators, indexers, and core protocol contributions.</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-electric/50 transition-colors">
                                    <Globe className="w-8 h-8 text-electric mb-3" />
                                    <h3 className="font-bold text-lg mb-1">dApps</h3>
                                    <p className="text-sm text-muted">DeFi, DAOs, and consumer crypto applications.</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 flex items-center justify-center">
                            {/* Abstract Code Visual */}
                            <div className="font-mono text-sm text-muted/50 w-full">
                                <div className="mb-2"><span className="text-electric">const</span> <span className="text-white">buildFuture</span> = <span className="text-electric">async</span> () ={'>'} {'{'}</div>
                                <div className="pl-4 mb-2"><span className="text-electric">await</span> deploy(<span className="text-green-400">&apos;Mainnet&apos;</span>);</div>
                                <div className="pl-4 mb-2"><span className="text-electric">return</span> <span className="text-white">impact</span>;</div>
                                <div>{'}'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section className="py-24 px-6 border-t border-white/10 bg-black">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">What We Do</h2>
                        <p className="text-xl text-muted max-w-2xl mx-auto">
                            Hands-on experience is the best teacher. We provide the platform for you to excel.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Hackathons */}
                        <div className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Code className="w-32 h-32" />
                            </div>
                            <h3 className="text-3xl font-heading font-bold mb-4 group-hover:text-electric transition-colors">Global Hackathons</h3>
                            <p className="text-muted text-lg mb-6">
                                We travel to and compete in major global hackathons, as well as participate in online hackathons. Our teams consistently place and win prizes.
                            </p>
                            <ul className="space-y-2 text-sm font-mono text-muted">
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>In-Person Competitions</li>
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>Online Hackathons</li>
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>Prize Winners</li>
                            </ul>
                        </div>

                        {/* Workshops */}
                        <div className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Terminal className="w-32 h-32" />
                            </div>
                            <h3 className="text-3xl font-heading font-bold mb-4 group-hover:text-electric transition-colors">Technical Workshops</h3>
                            <p className="text-muted text-lg mb-6">
                                Deep dives into protocol architecture, smart contract auditing, and zero-knowledge proofs. Learn from experts and get hands-on.
                            </p>
                            <ul className="space-y-2 text-sm font-mono text-muted">
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>Smart Contract Auditing</li>
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>ZK-Rollup Architecture</li>
                                <li className="flex items-center"><span className="w-2 h-2 bg-electric rounded-full mr-2"></span>MEV Strategies</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
