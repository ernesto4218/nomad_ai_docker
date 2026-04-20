import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { userRepository } from '$lib/server/repositories/user';
import { db } from '$lib/server/db';
import { agentRepository } from '$lib/server/repositories/agents';

export const load: PageServerLoad = async ({ locals, platform }) => {
  // 1. Auth Guard
  if (!locals.user){
    throw error(500, 'No local user');
    // redirect(302, '/entry');
  } 

  const userrepo = userRepository(db);
  const agentrepo = agentRepository(db);

  const user = await userrepo.findByUserId(locals.user.userId);
  const balance = await userrepo.getBalance(locals.user.userId);
  const agents = await agentrepo.getUserAgents(locals.user.userId);
  const userMaxAgents = await userrepo.getUserMapValues(locals.user.userId);
  const userMap = await userrepo.getUserMapValues(locals.user.userId);

  let maxAgent = false;
  const maxAgents = Number(userMaxAgents?.maxAgents) || 5;
  if (agents.length >= maxAgents) {
    console.log(maxAgents);
    maxAgent = true;
  }

  return {
    user,
    balance,
    agents,
    maxAgent,
    userMap
  };
};