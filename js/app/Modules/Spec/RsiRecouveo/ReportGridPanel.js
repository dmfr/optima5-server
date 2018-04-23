Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportGridPanel',{
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	
	alias: 'widget.op5specrsiveoreportgrid',
	
	initComponent: function() {
		// create tree for values
		var map_timescale_arr = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getReportValueAll(), function(row) {
			var ts = row.timescale ;
			if( !map_timescale_arr.hasOwnProperty(ts) ) {
				map_timescale_arr[ts] = [] ;
			}
			map_timescale_arr[ts].push( row ) ;
		}) ;
		var rootChildren = [] ;
		Ext.Object.each( map_timescale_arr, function(ts,arr) {
			var tsChildren = [] ;
			Ext.Array.each( arr, function(row) {
				var reportValue = {
					id: row.reportval_id,
					text: row.reportval_txt
				}
				if( Ext.isEmpty(row.subvalues) ) {
					reportValue.leaf = true ;
					reportValue.checked = false ;
				} else {
					reportValue.expanded = true ;
					reportValue.children = [] ;
					Ext.Array.each( row.subvalues, function(subrow) {
						reportValue.children.push({
							id: subrow.reportval_id,
							text: subrow.reportval_txt,
							leaf: true,
							checked: false
						});
					});
				}
				tsChildren.push(reportValue) ;
			}) ;
			switch( ts ) {
				case 'interval' :
					rootChildren.push({
						text: 'Compteurs sur intervalle',
						children: tsChildren,
						expanded: true
					});
					break ;
				case 'milestone' :
					rootChildren.push({
						text: 'Valeurs à date',
						children: tsChildren,
						expanded: true
					});
					break ;
			}
		}) ;
		
		
		Ext.apply(this,{
			layout: 'border',
			items:[{
				region: 'center',
				xtype: 'container',
				itemId: 'cntGrid',
				layout: 'fit',
				items:[{
					xtype: 'box',
					style: 'background: #eeeeee'
				}]
			},{
				region: 'east',
				itemId: 'cfgGroupby',
				
				title: 'Paramétrage axes',
				collapsible: true,
				collapsed: false,
				animCollapse: false,
				width: 300,
				
				xtype: 'form',
				layout: 'anchor',
				fieldDefaults: {
					anchor: '100%',
					labelWidth: 90
				},
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 8,
				items: [{
					xtype: 'fieldset',
					title: 'Rupture sur attribut',
					checkboxName: 'groupby_is_on',
					checkboxToggle: true,
					items: [{
						xtype: 'radiogroup',
						fieldLabel: 'Critère',
						// Arrange radio buttons into two columns, distributed vertically
						columns: 1,
						vertical: true,
						items: [
							{ boxLabel: 'Affectation', name: 'groupby_key', inputValue: 'user' },
							{ boxLabel: 'Entité', name: 'groupby_key', inputValue: 'soc'},
							{ boxLabel: 'Attribut', name: 'groupby_key', inputValue: 'atr' }
						]
					},{
						xtype: 'combobox',
						name: 'groupby_atr',
						fieldLabel: 'Intervalle',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['atr_id','atr_desc'],
							data : []
						},
						queryMode: 'local',
						displayField: 'atr_desc',
						valueField: 'atr_id'
					}]
				},{
					xtype: 'fieldset',
					title: 'Eclatement par période',
					checkboxName: 'timebreak_is_on',
					checkboxToggle: true,
					items: [{
						xtype: 'combobox',
						name: 'timebreak_group',
						fieldLabel: 'Intervalle',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['mode','lib'],
							data : [
								{mode:'DAY', lib:'Day (Y-m-d)'},
								{mode:'WEEK', lib:'Week (Y-week)'},
								{mode:'MONTH', lib:'Month (Y-m)'},
								{mode:'YEAR', lib:'Year (Y)'}
							]
						},
						queryMode: 'local',
						displayField: 'lib',
						valueField: 'mode'
					}]
				},{
					xtype: 'button',
					text: 'Appliquer',
					handler: function() {
						this.doLoad() ;
					},
					scope: this
				}]
			},{
				region: 'west',
				itemId: 'cfgValues',
				collapsible: true,
				collapsed: false,
				width: 300,
				xtype: 'treepanel',
				title: 'Données disponibles',
				rootVisible: false,
				useArrows: true,
				store: {
					root: {root: true, children: rootChildren, expanded: true},
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				listeners: {
					checkchange: this.onValuesCheckChange,
					scope: this
				}
			}]
		});
		this.callParent() ;
		this.onDateSet('month') ;
		this.resetGroupby() ;
		this.doTbarChanged() ;
		this.ready = true ;
	},
	onTbarChanged: function(filterValues) {
		var atrData = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(filterValues['filter_soc']), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( !atrRecord.is_filter ) {
				return ;
			}
			atrData.push({
				atr_id: atrRecord.atr_id,
				atr_desc: atrRecord.atr_desc
			})
		}) ;
		this.resetGroupby() ;
		this.down('#cfgGroupby').getForm().findField('groupby_atr').getStore().loadData(atrData) ;
	},
	onValuesCheckChange: function() {
		var cnt=0 ;
		this.down('#cfgValues').getRootNode().cascadeBy(function(node) {
			if( node.get('checked') ) {
				cnt++ ;
			}
		}) ;
		if( cnt>1 ) {
			this.down('#cfgGroupby').getForm().setValues({timebreak_is_on:false}) ;
		}
	},
	resetGroupby: function() {
		var groupbyForm = this.down('#cfgGroupby').getForm() ;
		groupbyForm.reset() ;
		groupbyForm.setValues({
			groupby_is_on: false,
			timebreak_is_on: false
		});
	},
	
	
	initFromTile: function(filterData, reportvalId) {
		this.ready = false ;
		this.setFilterValues(filterData) ;
		this.ready = true ;
		this.doLoad() ;
	},
	
	
	
	doLoad: function() {
		if( !this.ready ) {
			return ;
		}
		var cntGrid = this.down('#cntGrid') ;
		cntGrid.removeAll() ;
		cntGrid.add({
			xtype: 'box',
			cls:'op5-waiting'
		});
		
		var reportval_ids=[] ;
		this.down('#cfgValues').getRootNode().cascadeBy(function(node) {
			if( node.get('checked') ) {
				reportval_ids.push(node.get('id')) ;
			}
		}) ;
		
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getGrid',
				filters: Ext.JSON.encode(this.getFilterValues()),
				axes: Ext.JSON.encode(this.down('#cfgGroupby').getForm().getValues()),
				reportval_ids: Ext.JSON.encode(reportval_ids)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadData(ajaxResponse) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	onLoadData: function(queryData) {
		var cntGrid = this.down('#cntGrid') ;
		var fields = [],
			columns = [],
			data = queryData.data ;
		Ext.Array.each( queryData.columns, function(col) {
			if( Ext.isEmpty(col.reportval_id) ) {
				Ext.apply(col,{
					tdCls: 'op5-spec-rsiveo-taupe',
					width: 150
				}) ;
				fields.push({name: col.dataIndex, type:'string'}) ;
			} else {
				Ext.apply(col,{
					align: 'center'
				}) ;
				fields.push({name: col.dataIndex, type:'number', allowNull:true}) ;
			}
			columns.push(col) ;
		});
		
		var gridPanel = Ext.create('Ext.grid.Panel',{
			columns: columns,
			store: {
				fields: fields,
				data: data
			}
		});
		cntGrid.removeAll() ;
		cntGrid.add(gridPanel);
	},
	
	
	
	
}) ;
