'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data for MVP
const mtdData = {
    income: 14500.00,
    expenses: 8250.00,
    balance: 6250.00
};

const recentTransactions = [
    { id: 'tx_1', date: 'Oct 24, 2026', description: 'Anonymous Donation', category: 'Income', amount: 500.00 },
    { id: 'tx_2', date: 'Oct 23, 2026', description: 'Server Costs (AWS)', category: 'Infrastructure', amount: -150.00 },
    { id: 'tx_3', date: 'Oct 22, 2026', description: 'Donation - John D.', category: 'Income', amount: 1000.00 },
    { id: 'tx_4', date: 'Oct 21, 2026', description: 'Sober Living House Grant - House A', category: 'Grant', amount: -2000.00 },
];

export default function TransparencyBoard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');

    return (
        <div className="bg-white py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Radical Transparency</h2>
                    <p className="mt-4 text-lg leading-8 text-gray-600">
                        We believe that if you donate to help others in recovery, you deserve to know exactly where every cent goes. This board displays our real-time income and expenses.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Link href="/donate" className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">
                            Make a Donation
                        </Link>
                    </div>
                </div>

                <div className="mt-16 sm:mt-20">
                    <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3 lg:max-w-none lg:grid-cols-3">
                        <div className="flex flex-col gap-y-3 border-l border-gray-200 pl-6">
                            <dt className="text-sm leading-6 text-gray-600">MTD Income</dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-emerald-600">${mtdData.income.toLocaleString()}</dd>
                        </div>
                        <div className="flex flex-col gap-y-3 border-l border-gray-200 pl-6">
                            <dt className="text-sm leading-6 text-gray-600">MTD Expenses</dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-red-600">${mtdData.expenses.toLocaleString()}</dd>
                        </div>
                        <div className="flex flex-col gap-y-3 border-l border-gray-200 pl-6">
                            <dt className="text-sm leading-6 text-gray-600">Net Operating Balance</dt>
                            <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">${mtdData.balance.toLocaleString()}</dd>
                        </div>
                    </dl>
                </div>

                <div className="mt-16">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}>
                                Monthly Overview
                            </button>
                            <button onClick={() => setActiveTab('ledger')} className={`${activeTab === 'ledger' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}>
                                Public Ledger
                            </button>
                        </nav>
                    </div>

                    <div className="mt-8">
                        {activeTab === 'overview' ? (
                            <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-500">
                                <p>Interactive charts visualizing spending categories (Infrastructure, Grants, Operations) will appear here.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {recentTransactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{tx.date}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{tx.description}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}>
                                                        {tx.category}
                                                    </span>
                                                </td>
                                                <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
