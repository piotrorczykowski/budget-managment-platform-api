import { EntityRepository } from '@mikro-orm/mysql'
import Budget from '../../database/entities/Budget'
import { BudgetData } from './types'
import User from '../../database/entities/User'
import moment from 'moment'
import { PaginatedData } from './types'
import { QueryOrder } from '@mikro-orm/core'
import BudgetRecordsService from './budgetRecordsService'

export default class BudgetsService {
    budgetRepository: EntityRepository<Budget>
    budgetRecordsService: BudgetRecordsService

    constructor({
        budgetRepository,
        budgetRecordsService,
    }: {
        budgetRepository: EntityRepository<Budget>
        budgetRecordsService: BudgetRecordsService
    }) {
        this.budgetRepository = budgetRepository
        this.budgetRecordsService = budgetRecordsService
    }

    public async createBudget(user: User, budgetData: BudgetData): Promise<Budget> {
        let budget: Budget = new Budget()
        budget.name = budgetData.name
        budget.planned = budgetData.planned
        budget.startDate = moment(budgetData.startDate).utc().startOf('day').toDate()
        budget.endDate = moment(budgetData.endDate).utc().endOf('day').toDate()
        budget.categories = budgetData.categories
        budget.user = user

        budget = await this.budgetRecordsService.updateBudgetProgress(budget)

        await this.budgetRepository.persistAndFlush(budget)
        return budget
    }

    public async deleteBudget(budgetId: number): Promise<void> {
        const budget: Budget = await this.budgetRepository.findOneOrFail({ id: budgetId })
        await this.budgetRepository.removeAndFlush(budget)
    }

    public async getUserBudgets({
        userId,
        page,
        pageSize,
        searchByValue,
    }: {
        userId: number
        page: number
        pageSize: number
        searchByValue: string
    }): Promise<PaginatedData> {
        const skipCount: number = (page - 1) * pageSize

        const budgets: Budget[] = await this.budgetRepository.find(
            {
                name: { $like: `%${searchByValue}%` },
                user: { id: userId },
            },
            {
                orderBy: {
                    endDate: QueryOrder.DESC,
                },
                offset: skipCount,
                limit: pageSize,
            }
        )

        const budgetsCount: number = await this.budgetRepository.count({
            name: { $like: `%${searchByValue}%` },
        })
        const pageCount: number = Math.ceil(budgetsCount / pageSize)

        return {
            items: budgets,
            pageCount: pageCount,
        }
    }
}
