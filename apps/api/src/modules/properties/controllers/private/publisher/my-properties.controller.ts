import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { PublisherGroup, RoleGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { DbSupport } from '@/support/db';
import { Audit } from '@/modules/audit';
import { CreatePropertyDto } from '@/modules/properties/contracts/dto/create-property.dto';
import { AssignAgentDto, ChangeStatusDto } from '@/modules/properties/contracts/dto/manage-property.dto';
import { MinePropertiesDto } from '@/modules/properties/contracts/dto/mine-properties.dto';
import { UpdatePropertyDto } from '@/modules/properties/contracts/dto/update-property.dto';
import type { PropertyDetailResource, PropertyListResource } from '@/modules/properties/contracts/resources';
import { PropertiesService } from '@/modules/properties/services/properties.service';

/**
 * Propiedades propias: listar, publicar, editar, cambiar estado, asignar agente y borrar.
 * Acceso por defecto: propietario, agencia y admin. Las excepciones llevan su propio grupo en el metodo.
 */
@PublisherGroup()
@ApiTags('properties')
@Controller()
export class MyPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('mine')
  mine(@Query() query: MinePropertiesDto, @CurrentUser() user: AuthUserContext): Promise<PropertyListResource> {
    return this.propertiesService.mine(user, query.page, query.limit);
  }

  // Excepcion: el admin no publica.
  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY)
  @Audit('properties.create', 'Property')
  @Post()
  create(
    @Body() dto: CreatePropertyDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    return this.propertiesService.create(user, dto, ctx);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    return this.propertiesService.update(user, id, dto, ctx);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    return this.propertiesService.changeStatus(user, id, dto.status, dto.acceptsVisits, ctx);
  }

  // Excepcion: solo agencia y admin asignan agentes.
  @RoleGroup(DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Patch(':id/agent')
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignAgentDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    return this.propertiesService.assignAgent(user, id, dto.agentUserId, ctx);
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    await this.propertiesService.remove(user, id, ctx);
  }
}
