import {
  BOOKING_STAGE,
  BOOKING_STATUS,
  ORDER_TAB,
  PAY_METHOD,
  ROOM
} from '../../types/booking/booking.type';
import {
  AREA,
  CLAIM_AREA,
  CLAIM_KIND,
  DIFFICULTY,
  PLAN_STATUS
} from '../../types/plan/plan.type';
import { ROLES_ENUM } from '../../types/user/role.type';

const values = (list: string[]) => list.join('\n    ');

export default `#graphql
  enum ROLE {
    ${values(ROLES_ENUM)}
  }

  enum AREA {
    ${values(Object.values(AREA))}
  }

  enum DIFFICULTY {
    ${values(Object.values(DIFFICULTY))}
  }

  enum PLAN_STATUS {
    ${values(Object.values(PLAN_STATUS))}
  }

  enum CLAIM_KIND {
    ${values(Object.values(CLAIM_KIND))}
  }

  enum CLAIM_AREA {
    ${values(Object.values(CLAIM_AREA))}
  }

  enum PAY_METHOD {
    ${values(Object.values(PAY_METHOD))}
  }

  enum ROOM {
    ${values(Object.values(ROOM))}
  }

  enum BOOKING_STATUS {
    ${values(Object.values(BOOKING_STATUS))}
  }

  enum BOOKING_STAGE {
    ${values(Object.values(BOOKING_STAGE))}
  }

  enum ORDER_TAB {
    ${values(Object.values(ORDER_TAB))}
  }
`;
