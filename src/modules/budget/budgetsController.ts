import { GET, POST, before, route } from 'awilix-koa'
import { Context } from 'koa'
import BudgetsService from './budgetsService'
import { BudgetData } from './types'
import userCheckMiddleware from '../../middleware/userCheckMiddleware'

@route('/budgets')
export default class BudgetsController {
    budgetsService: BudgetsService

    constructor({ budgetsService }: { budgetsService: BudgetsService }) {
        this.budgetsService = budgetsService
    }

    @route('/')
    @POST()
    public async createBudget(ctx: Context) {
        ctx.body = await this.budgetsService.createBudget(ctx.state.user, <BudgetData>ctx.request.body)
        ctx.status = 201
    }

    @before(userCheckMiddleware)
    @route('/:userId')
    @GET()
    public async getUserBudgets(ctx: Context) {
        ctx.body = await this.budgetsService.getUserBudgets({
            userId: ctx.params.userId,
            page: Number(ctx.query.page),
            pageSize: Number(ctx.query.pageSize),
            searchByValue: <string>ctx.query.searchByValue,
        })

        ctx.status = 200
    }
}
