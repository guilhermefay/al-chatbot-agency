const { supabase } = require('../src/config/supabase');

async function verifyToolConfig() {
  try {
    console.log('Verifying the inserted tool configuration...');

    const company_id = 'b3a660b5-2cc4-4fb0-91f7-681ca1365592';
    
    // Query the tool configuration
    const { data: toolConfigs, error } = await supabase
      .from('tools_config')
      .select('*')
      .eq('company_id', company_id)
      .eq('tool_name', 'google_calendar');

    if (error) {
      console.error('Error querying tool configuration:', error);
      throw error;
    }

    if (!toolConfigs || toolConfigs.length === 0) {
      console.log('❌ No tool configuration found for the specified company and tool name.');
      return;
    }

    console.log(`✅ Found ${toolConfigs.length} matching tool configuration(s):`);
    
    toolConfigs.forEach((config, index) => {
      console.log(`\n--- Configuration ${index + 1} ---`);
      console.log(`ID: ${config.id}`);
      console.log(`Tool ID: ${config.tool_id}`);
      console.log(`Company ID: ${config.company_id}`);
      console.log(`Tool Name: ${config.tool_name}`);
      console.log(`Tool Type: ${config.tool_type}`);
      console.log(`Enabled: ${config.enabled}`);
      console.log(`Created At: ${config.created_at}`);
      console.log(`Updated At: ${config.updated_at}`);
      
      // Parse and display the credentials (config) safely
      try {
        const credentials = JSON.parse(config.credentials);
        console.log('Configuration (credentials):');
        console.log(`  - Client ID: ${credentials.client_id}`);
        console.log(`  - Client Secret: ${credentials.client_secret}`);
        console.log(`  - Refresh Token: ${credentials.refresh_token}`);
        console.log(`  - Calendar ID: ${credentials.calendar_id}`);
      } catch (parseError) {
        console.log('Configuration (credentials): Unable to parse');
      }
      
      console.log(`Custom Config: ${JSON.stringify(config.custom_config, null, 2)}`);
    });

    return toolConfigs;

  } catch (error) {
    console.error('Failed to verify tool configuration:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  verifyToolConfig()
    .then(() => {
      console.log('\n🎉 Verification completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyToolConfig };