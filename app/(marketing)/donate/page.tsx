import Link from 'next/link';

export default function DonatePage() {
    return (
        <div className="bg-white py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Support Recovery Efforts</h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Former addicts that have become successful want to help others. Your donation goes directly to funding beds, providing resources, and keeping our platform free for those who need it most.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8">
                        <div className="rounded-2xl p-8 ring-1 ring-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">Make a Donation</h3>
                            <p className="mt-4 text-sm text-gray-600">Your contribution is tax-deductible. A receipt with the requisite tax documents will be emailed to you immediately after processing.</p>

                            <div className="mt-8">
                                {/* 
                  TODO: Integrate Stripe Elements or Hosted Checkout 
                  For MVP, we'll link out or stub the payment form
               */}
                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Stripe payment processing would open here."); }}>
                                    <div>
                                        <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">Amount (USD)</label>
                                        <div className="relative mt-2 rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input type="number" name="amount" id="amount" className="block w-full rounded-md border-0 py-1.5 pl-7 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" placeholder="0.00" aria-describedby="price-currency" />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-gray-500 sm:text-sm" id="price-currency">USD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                                        Donate Now
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-8 ring-1 ring-slate-200">
                            <h3 className="text-xl font-semibold text-gray-900">Financial Transparency</h3>
                            <p className="mt-4 text-sm text-gray-600">
                                We believe in 100% radical transparency. You can view exactly how every dollar is spent, updated in real-time on our transparency board.
                            </p>
                            <div className="mt-8 flex justify-center">
                                <Link href="/transparency" className="text-sm font-semibold leading-6 text-emerald-600">
                                    View Transparency Board <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
