Ext.define('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
	extend:'Ext.form.field.Picker',

	requires: [
		'Ext.XTemplate',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamTree'
	], 

	preSubTpl: [
		'<div id="{cmpId}-triggerWrap" data-ref="triggerWrap" class="{triggerWrapCls} {triggerWrapCls}-{ui}">',
			'<div id={cmpId}-inputWrap data-ref="inputWrap" class="{inputWrapCls} {inputWrapCls}-{ui}">'
	],
	
	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : null ,
	
	selectMode: 'SINGLE',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BibleTreePicker','No module reference ?') ;
		}
		
		this.on('afterrender',this.displayValue,this) ;
		
		this.cfgParamTree = Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamTree',{
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
			
			optimaModule: this.optimaModule,
			accountRecord: this.accountRecord,
			cfgParam_id: this.cfgParam_id,
			selectMode: this.selectMode, // SINGLE / MULTI
			width:250,
			height:300,
			listeners: {
				change: {
					fn: function(){
						this.onChange() ;
					},
					scope: this
				},
				load: {
					fn: this.onAfterLoad,
					scope: this
				}
			}
		});
		
		this.callParent() ;
	},
	setRootNode: function(rootNode) {
		var cfgParamTree = this.cfgParamTree ;
		cfgParamTree.setRootNode(rootNode) ;
	},
	onAfterLoad: function() {
		this.isReady = true ;
		this.fireEvent('ready',this) ;
	},
	doAuthCleanup: function() {},
	doManualCleanup: function( arrIds ) {
		var cfgParamTree = this.cfgParamTree,
			treeStore = cfgParamTree.getStore(),
			treeNode = treeStore.getRootNode() ;
		
		var nodesToRemove = [] ;
		treeNode.cascadeBy( function(node) {
			if( node.isLeaf() && !Ext.Array.contains(arrIds,node.getId()) ) {
				nodesToRemove.push(node) ;
			}
		}) ;
		Ext.Array.each( nodesToRemove, function(node) {
			while(true) {
				parentNode = node.parentNode ;
				node.remove() ;
				node = parentNode ;
				if( node == null ){
					break ;
				}
				if( node.hasChildNodes() ) {
					break ;
				}
			}
		}) ;
		cfgParamTree.forceValue = true ;
		cfgParamTree.autoAdvance() ;
	},
	
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('ready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		this.callParent() ;
		
		//HACK ?
		this.picker.setXY([0,0]) ;
		this.alignPicker();
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}
		return this.cfgParamTree ;
	},
	onChange: function() {
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
			
		this.value = selectedValue ;
		this.fireEvent('change',this,selectedValue,this.oldValue) ;
		this.oldValue = selectedValue ;
		
		this.displayValue() ;
	},
	displayValue: function() {
		if( !this.rendered ) {
			this.on('afterrender',function(){
				this.displayValue();
			},this,{
				single:true
			}) ;
			return ;
		}
		
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
		if( Ext.isEmpty(selectedValue) ) {
			this.divicon.removeCls('biblepicker-iconimg-oktree') ;
			this.divicon.addCls('biblepicker-iconimg-nok') ;
			this.divtext.dom.innerHTML = this.cfgParam_emptyDisplayText ;
		} else {
			this.divicon.removeCls('biblepicker-iconimg-nok') ;
			this.divicon.addCls('biblepicker-iconimg-oktree') ;
			if( this.selectMode == 'MULTI' ) {
				var vals = [] ;
				Ext.Array.each( selectedValue, function(val) {
					vals.push( val ) ;
				});
				this.divtext.dom.innerHTML = vals.join('&#160;'+'/'+'&#160;') ;
			} else {
				this.divtext.dom.innerHTML = cfgParamTree.getStore().getNodeById(selectedValue).get('nodeText') ;
				if( this.cfgParam_id.indexOf('ADR_')===0 && cfgParamTree.getStore().getNodeById(selectedValue).getDepth()==2 ) {
					this.divtext.dom.innerHTML = cfgParamTree.getStore().getNodeById(selectedValue).parentNode.get('nodeText') ;
				}
			}
		}
	},
	
	setValue: function(value) {
		this.value = value ;
		
		if( !this.isReady ) {
			this.on('ready',function(){
				this.setRawValue(value);
			},this,{
				single:true
			}) ;
			return ;
		}
		var cfgParamTree = this.cfgParamTree ;
		cfgParamTree.setValue(value,true) ;
		this.displayValue() ;
		this.onChange() ;
		if( Ext.isEmpty(value) ) {
			//cfgParamTree.autoAdvance() ;
		}
	},
	
	getValue: function() {
		return this.value ;
	},
	getRawValue: function() {
		return this.value || '' ;
	},
	getSelectedNode: function() {
		return this.cfgParamTree.getCheckedNode() ;
	},
	getLeafNodesKey: function() {
		var cfgParamTree = this.cfgParamTree,
			retValue = cfgParamTree.getLeafNodesKey() ;
		return retValue ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	},
	
	reset: function() {
		this.callParent() ;
		this.displayValue() ;
	},
	
	onDestroy: function() {
		if( this.cfgParamTree ) {
			this.cfgParamTree.destroy() ;
		}
	}
});
