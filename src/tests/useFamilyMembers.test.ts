
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Tests the useFamilyMembers hook and family member fetching functionality
 */
export async function testFamilyMembersHook() {
  testLogger.clear();
  testLogger.info('FAMILY_MEMBERS_TEST', 'Starting family members hook test');
  
  // Test 1: Basic family members fetch
  try {
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .limit(1);
      
    if (!families || families.length === 0) {
      testLogger.warning('FAMILY_MEMBERS_TEST', 'No families found to test with');
      return testLogger.generateReport();
    }
    
    const familyId = families[0].id;
    testLogger.info('FAMILY_MEMBERS_TEST', `Testing with family ID: ${familyId}`);
    
    // Fetch family members
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);
      
    if (error) {
      testLogger.error('FAMILY_MEMBERS_TEST', 'Error fetching family members', error);
    } else if (!members || members.length === 0) {
      testLogger.warning('FAMILY_MEMBERS_TEST', 'No family members found for family');
    } else {
      testLogger.success('FAMILY_MEMBERS_TEST', `Found ${members.length} family members`, {
        memberCount: members.length
      });
      
      // Check for duplicates
      const userIds = members.map(m => m.user_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      if (userIds.length !== uniqueUserIds.length) {
        testLogger.warning('FAMILY_MEMBERS_TEST', 'Duplicate family members detected', {
          total: userIds.length,
          unique: uniqueUserIds.length
        });
      } else {
        testLogger.success('FAMILY_MEMBERS_TEST', 'No duplicate family members found');
      }
    }
    
    // Test fetching family members with an invalid ID
    const { data: invalidMembers, error: invalidError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', '00000000-0000-0000-0000-000000000000');
      
    if (invalidError) {
      testLogger.error('FAMILY_MEMBERS_TEST', 'Error with invalid family ID test', invalidError);
    } else {
      testLogger.success('FAMILY_MEMBERS_TEST', 'Invalid family ID test passed');
    }
    
    // Generate and return the test report
    return testLogger.generateReport();
  } catch (error) {
    testLogger.error('FAMILY_MEMBERS_TEST', 'Unexpected error in family members test', error);
    return testLogger.generateReport();
  }
}

/**
 * Tests the performance of family members fetching
 */
export async function testFamilyMembersPerformance() {
  testLogger.clear();
  testLogger.info('PERFORMANCE_TEST', 'Starting family members performance test');
  
  try {
    // Measure time for fetching families
    const startFamilies = performance.now();
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .limit(5);
    const endFamilies = performance.now();
    
    testLogger.info('PERFORMANCE_TEST', `Fetching families took ${(endFamilies - startFamilies).toFixed(2)}ms`);
    
    if (!families || families.length === 0) {
      testLogger.warning('PERFORMANCE_TEST', 'No families found for performance testing');
      return testLogger.generateReport();
    }
    
    // Measure sequential vs. parallel performance
    const familyIds = families.map(f => f.id);
    
    // Sequential fetching
    const startSequential = performance.now();
    for (const id of familyIds) {
      await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', id);
    }
    const endSequential = performance.now();
    
    // Parallel fetching
    const startParallel = performance.now();
    await Promise.all(
      familyIds.map(id => 
        supabase
          .from('family_members')
          .select('*')
          .eq('family_id', id)
      )
    );
    const endParallel = performance.now();
    
    const sequentialTime = endSequential - startSequential;
    const parallelTime = endParallel - startParallel;
    const improvement = ((sequentialTime - parallelTime) / sequentialTime) * 100;
    
    testLogger.success('PERFORMANCE_TEST', 'Performance comparison complete', {
      sequential: `${sequentialTime.toFixed(2)}ms`,
      parallel: `${parallelTime.toFixed(2)}ms`,
      improvement: `${improvement.toFixed(2)}%`
    });
    
    // Generate and return the test report
    return testLogger.generateReport();
  } catch (error) {
    testLogger.error('PERFORMANCE_TEST', 'Unexpected error in performance test', error);
    return testLogger.generateReport();
  }
}
