
/**
 * Creates a helper function to check if a database function exists
 * Uses a direct API call to our function_exists database function
 */
export async function functionExists(functionName: string): Promise<boolean> {
  try {
    // Use a direct fetch since we can't query pg_proc directly
    const response = await fetch(
      `https://yuraqejlapinpglrkkux.supabase.co/rest/v1/rpc/function_exists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use the public anon key
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cmFxZWpsYXBpbnBnbHJra3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzQ5NTMsImV4cCI6MjA2MDg1MDk1M30.PyS67UKFVi5iriwjDmeJWLrHBOyN4cL-IRBdpLYdpZ4',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cmFxZWpsYXBpbnBnbHJra3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzQ5NTMsImV4cCI6MjA2MDg1MDk1M30.PyS67UKFVi5iriwjDmeJWLrHBOyN4cL-IRBdpLYdpZ4`
        },
        body: JSON.stringify({ function_name: functionName })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error checking function existence: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error checking for function ${functionName}:`, error);
    return false;
  }
}
