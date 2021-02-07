import { penalties, penaltyTypes } from "./penalties";
import type { PlayerGameSim, TeamNum } from "./types";

type PenaltyBoxEntry = {
	p: PlayerGameSim;
	penalty: typeof penalties[number];
	minutesLeft: number;
};

class PenaltyBox {
	onPenaltyOver;

	players: [PenaltyBoxEntry[], PenaltyBoxEntry[]];

	constructor(
		onPenaltyOver: (arg: {
			t: TeamNum;
			p: PlayerGameSim;
			minutesAgo: number;
		}) => void,
	) {
		this.onPenaltyOver = onPenaltyOver;
		this.players = [[], []];
	}

	add(t: TeamNum, p: PlayerGameSim, penalty: typeof penalties[number]) {
		const penaltyType = penaltyTypes[penalty.type];

		this.players[t].push({
			p,
			penalty,
			minutesLeft: penaltyType.minutes,
		});
	}

	count(t: TeamNum) {
		return this.players[t].length;
	}

	has(t: TeamNum, p: PlayerGameSim) {
		return this.players[t].some(entry => entry.p === p);
	}

	goal(scoringTeam: TeamNum) {
		const t = scoringTeam === 0 ? 1 : 0;
		for (const entry of this.players[t]) {
			const penaltyType = penaltyTypes[entry.penalty.type];
			entry.minutesLeft -= penaltyType.minutesReducedAfterGoal;
		}

		this.checkIfPenaltiesOver();
	}

	advanceClock(minutes: number) {
		for (const t of [0, 1] as const) {
			for (const entry of this.players[t]) {
				entry.minutesLeft -= minutes;
			}
		}

		this.checkIfPenaltiesOver();
	}

	checkIfPenaltiesOver() {
		for (const t of [0, 1] as const) {
			this.players[t] = this.players[t].filter(entry => {
				if (entry.minutesLeft > 0) {
					return true;
				}

				this.onPenaltyOver({
					t,
					p: entry.p,
					minutesAgo: -entry.minutesLeft,
				});

				return false;
			});
		}
	}

	splitUpAdvanceClock(minutes: number) {
		const needToStopAt = new Set<number>([minutes]);

		for (const t of [0, 1] as const) {
			for (const entry of this.players[t]) {
				if (entry.minutesLeft < minutes) {
					needToStopAt.add(entry.minutesLeft);
				}
			}
		}

		const minutesArray = Array.from(needToStopAt).sort((a, b) => a - b);

		return minutesArray.map((x, i) => {
			if (i === 0) {
				return x;
			}

			return x - minutesArray[i - 1];
		});
	}
}

export default PenaltyBox;
