const stripe_key =
	process.env.NODE_ENV === 'production'
		? process.env.STRIPE_PUBLISHABLE_KEY
		: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default stripe_key;
